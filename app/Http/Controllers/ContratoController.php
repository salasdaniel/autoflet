<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Contratos;
use App\Models\Chofer;
use App\Models\Vehiculo;
use App\Models\RegimenPago;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ContratoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('contratos', [
            'contratos' => Contratos::with([
                    'chofer',
                    'vehiculo',
                    'regimenPago',
                    'calendarioPagos' => function($q) { $q->where('activo', true); }
                ])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($contrato) {
                    // Cálculos de pagos
                    $pagosTotales = $contrato->calendarioPagos->count();
                    $pagosPendientes = $contrato->calendarioPagos->where('saldo', '>', 0)->count();
                    $montoTotal = $contrato->calendarioPagos->sum('monto_pago');

                    return [
                        'id' => $contrato->id,
                        'fecha_inicio' => $contrato->fecha_inicio?->format('Y-m-d'),
                        'fecha_fin' => $contrato->fecha_fin?->format('Y-m-d'),
                        'chofer' => $contrato->chofer ? $contrato->chofer->nombre_completo : '',
                        'chofer_id' => $contrato->id_chofer,
                        'vehiculo' => $contrato->vehiculo ? 
                            $contrato->vehiculo->modelo . ' (' . $contrato->vehiculo->chapa . ') - ' . $contrato->vehiculo->color : '',
                        'vehiculo_id' => $contrato->id_vehiculo,
                        'regimen_pago' => $contrato->regimenPago ? $contrato->regimenPago->nombre : 'Sin régimen',
                        'monto' => $contrato->monto,
                        'moneda' => $contrato->moneda,
                        'cantidad_pagos' => $contrato->cantidad_pagos,
                        'total_pagos' => $contrato->total_pagos,
                        'activo' => $contrato->activo,
                        // Nuevos campos calculados
                        'pagos_totales' => $pagosTotales,
                        'pagos_pendientes' => $pagosPendientes,
                        'monto_total' => $montoTotal
                    ];
                })
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'id_chofer' => 'required|exists:chofers,id',
            'id_vehiculo' => 'required|exists:vehiculos,id',
            'regimen_pago' => 'required|string|in:MENSUAL,QUINCENAL,SEMANAL,DIARIO',
            'monto' => 'required|numeric|min:0',
            'moneda' => 'required|string|in:PYG,USD,BRL',
            'cantidad_pagos' => 'nullable|integer|min:1',
            'activo' => 'boolean'
        ]);

        $data = $request->all();
        $data['id_user'] = Auth::id();
        $data['activo'] = $request->has('activo') ? $request->boolean('activo') : true;
        
        // Convertir código de régimen a ID
        $regimen = RegimenPago::porCodigo($data['regimen_pago']);
        if (!$regimen) {
            return response()->json([
                'success' => false,
                'message' => 'Régimen de pago no válido'
            ], 422);
        }
        $data['regimen_pago'] = $regimen->id;

        $contrato = Contratos::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Contrato creado exitosamente',
            'contrato' => $contrato
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Contratos $contrato)
    {
        $contrato->load([
            'chofer',
            'vehiculo',
            'regimenPago',
            'calendarioPagos' => function($q) { $q->where('activo', true); }
        ]);
        
        // Cálculos de pagos
        $pagosTotales = $contrato->calendarioPagos->count();
        $pagosPendientes = $contrato->calendarioPagos->where('saldo', '>', 0)->count();
        $montoTotal = $contrato->calendarioPagos->sum('monto_pago');
        
        return response()->json([
            'id' => $contrato->id,
            'fecha_inicio' => $contrato->fecha_inicio?->format('Y-m-d'),
            'fecha_fin' => $contrato->fecha_fin?->format('Y-m-d'),
            'chofer' => $contrato->chofer ? $contrato->chofer->nombre_completo : '',
            'chofer_id' => $contrato->id_chofer,
            'vehiculo' => $contrato->vehiculo ? 
                $contrato->vehiculo->modelo . ' (' . $contrato->vehiculo->chapa . ') - ' . $contrato->vehiculo->color : '',
            'vehiculo_id' => $contrato->id_vehiculo,
            'regimen_pago' => $contrato->regimenPago ? $contrato->regimenPago->nombre : 'Sin régimen',
            'monto' => $contrato->monto,
            'moneda' => $contrato->moneda,
            'cantidad_pagos' => $contrato->cantidad_pagos,
            'total_pagos' => $contrato->total_pagos,
            'activo' => $contrato->activo,
            'pagos_generados' => $pagosTotales, // Cambiado para consistencia
            // Nuevos campos calculados
            'pagos_totales' => $pagosTotales,
            'pagos_pendientes' => $pagosPendientes,
            'monto_total' => $montoTotal
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Contratos $contrato)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Contratos $contrato)
    {
        $request->validate([
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'id_chofer' => 'required|exists:chofers,id',
            'id_vehiculo' => 'required|exists:vehiculos,id',
            'regimen_pago' => 'required|string|in:MENSUAL,QUINCENAL,SEMANAL,DIARIO',
            'monto' => 'required|numeric|min:0',
            'moneda' => 'required|string|in:PYG,USD,BRL',
            'cantidad_pagos' => 'nullable|integer|min:1',
            'activo' => 'boolean'
        ]);

        $data = $request->all();
        $data['activo'] = $request->has('activo') ? $request->boolean('activo') : true;

        // Convertir código de régimen a ID
        $regimen = RegimenPago::porCodigo($data['regimen_pago']);
        if (!$regimen) {
            return response()->json([
                'success' => false,
                'message' => 'Régimen de pago no válido'
            ], 422);
        }
        $data['regimen_pago'] = $regimen->id;

        $contrato->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Contrato actualizado exitosamente',
            'contrato' => $contrato
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Contratos $contrato)
    {
        // Verificar si tiene pagos asociados
        if ($contrato->calendarioPagos()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el contrato porque tiene pagos asociados'
            ], 422);
        }

        $contrato->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contrato eliminado exitosamente'
        ]);
    }

    /**
     * Anular el contrato: marcar contrato como inactivo y desactivar calendarios_pagos relacionados
     */
    public function anular(Contratos $contrato)
    {
        try {
            // contar pagos pendientes antes
            $pagosPendientes = $contrato->calendarioPagos()->where('saldo', '>', 0)->count();

            // desactivar calendarios_pagos relacionados
            $contrato->calendarioPagos()->update(['activo' => false]);

            // marcar contrato como inactivo (anulado)
            $contrato->activo = false;
            $contrato->save();

            return response()->json([
                'success' => true,
                'message' => "Contrato anulado. Se anularon {$pagosPendientes} pagos pendientes",
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error anular contrato: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al anular el contrato'
            ], 500);
        }
    }

    /**
     * Get data for dropdowns
     */
    public function getData()
    {
        return response()->json([
            'choferes' => Chofer::select('id', 'nombre_completo')
                ->orderBy('nombre_completo')
                ->get(),
            'vehiculos' => Vehiculo::select('id', 'modelo', 'chapa', 'color')
                ->orderBy('modelo')
                ->get()
                ->map(function($vehiculo) {
                    return [
                        'id' => $vehiculo->id,
                        'nombre' => $vehiculo->modelo . ' (' . $vehiculo->chapa . ') - ' . $vehiculo->color
                    ];
                }),
            'regimenes' => RegimenPago::activo()
                ->select('id', 'nombre', 'codigo', 'dias', 'descripcion')
                ->orderBy('dias')
                ->get()
                ->map(function($regimen) {
                    return [
                        'id' => $regimen->id,
                        'codigo' => $regimen->codigo,
                        'nombre' => $regimen->nombre,
                        'descripcion' => $regimen->descripcion
                    ];
                })
        ]);
    }
}
