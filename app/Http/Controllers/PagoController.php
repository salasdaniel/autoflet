<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\FormaCobroPago;
use App\Models\CalendarioPagos;
use App\Models\TipoFormaPago;
use App\Models\Banco;

class PagoController extends Controller
{
    public function tipos()
    {
        return response()->json(\App\Models\TipoFormaPago::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_calendario_pago' => 'required|exists:calendario_pagos,id',
            'tipo_forma_pago_id' => 'required|exists:tipo_forma_pago,id',
            'monto' => 'required|numeric',
            'moneda' => 'required|string',
            'banco_destino_id' => 'nullable|exists:bancos,id',
            'nro_comprobante' => 'nullable|string|max:255',
            'adjunto' => 'nullable|file|max:5120', // max 5MB
        ]);

        $data = $request->only(['id_calendario_pago', 'tipo_forma_pago_id', 'banco_destino_id', 'monto', 'moneda', 'nro_comprobante']);
        $data['id_user'] = Auth::id();

        if ($request->hasFile('adjunto')) {
            $path = $request->file('adjunto')->store('comprobantes', 'public');
            $data['adjunto'] = $path;
        }

        $data['fecha_pago'] = now();

        $forma = FormaCobroPago::create($data);

        // actualizar calendario_pagos
        $pago = CalendarioPagos::find($data['id_calendario_pago']);
        if ($pago) {
            // Restar el monto del pago al saldo
            $pago->saldo = $pago->saldo - $data['monto'];
            
            // Si el saldo es 0 o menor, marcar como pagado
            if ($pago->saldo <= 0) {
                $pago->pagado = true;
                $pago->saldo = 0; // Asegurar que no quede en negativo
            }
            
            // Como fecha_pago es tipo DATE, usar solo la fecha actual sin hora
            $pago->fecha_pago = now()->format('Y-m-d');
            $pago->save();
        }

        return response()->json(['success' => true, 'forma' => $forma]);
    }

    public function getPaymentDetail($idCalendarioPago)
    {
        // Buscar el pago en forma_cobro_pagos usando el id_calendario_pago
        $formaCobro = FormaCobroPago::where('id_calendario_pago', $idCalendarioPago)
            ->with(['tipoFormaPago', 'bancoDestino'])
            ->first();

        if (!$formaCobro) {
            return response()->json(['error' => 'Pago no encontrado'], 404);
        }

        // Obtener información del calendario de pagos
        $calendarioPago = CalendarioPagos::with(['contrato.chofer', 'contrato.vehiculo'])
            ->where('activo', true)
            ->find($idCalendarioPago);

        if (!$calendarioPago) {
            return response()->json(['error' => 'Calendario de pago no encontrado o inactivo'], 404);
        }

        // Preparar la respuesta con el formato esperado por el frontend
        $response = [
            'id' => $formaCobro->id,
            'id_calendario_pago' => $formaCobro->id_calendario_pago,
            'tipo_forma_pago' => $formaCobro->tipoFormaPago ? $formaCobro->tipoFormaPago->nombre : '',
            'monto' => $formaCobro->monto,
            'moneda' => $formaCobro->moneda,
            'banco_destino' => $formaCobro->bancoDestino ? $formaCobro->bancoDestino->nombre : null,
            'nro_comprobante' => $formaCobro->nro_comprobante,
            'adjunto_path' => $formaCobro->adjunto,
            'fecha_pago' => $formaCobro->fecha_pago,
            'chofer' => $calendarioPago->contrato->chofer ? $calendarioPago->contrato->chofer->nombre . ' ' . $calendarioPago->contrato->chofer->apellido : '',
            'vehiculo' => $calendarioPago->contrato->vehiculo ? $calendarioPago->contrato->vehiculo->modelo . ' - ' . $calendarioPago->contrato->vehiculo->chapa : '',
            'chapa' => $calendarioPago->contrato->vehiculo ? $calendarioPago->contrato->vehiculo->chapa : '',
            'nro_contrato' => $calendarioPago->contrato->id ?? null,
        ];

        return response()->json($response);
    }
}
