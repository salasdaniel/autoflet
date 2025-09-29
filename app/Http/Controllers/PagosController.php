<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PagosController extends Controller
{
    public static function addContrato($fecha_inicio, $fecha_fin, $id_chofer, $regimen_pago, $monto, $id_vehiculo, $cantidadPagos = null )
    {
        try{
            
            $contrato = new \App\Models\Contratos();
            $contrato->fecha_inicio = $fecha_inicio;
            $contrato->fecha_fin = $fecha_fin;
            $contrato->id_chofer = $id_chofer;
            $contrato->regimen_pago = $regimen_pago;
            $contrato->activo = true; // Por defecto, el contrato está activo
            $contrato->monto = $monto; // Monto del contrato, si se proporciona
            $contrato->moneda = 'PYG'; // Moneda por defecto
            $contrato->id_vehiculo = $id_vehiculo; // Inicialmente no se asigna un vehículo
            // Si se pasa cantidadPagos desde frontend, la asignamos
            if ($cantidadPagos !== null) {
                $contrato->cantidad_pagos = (int) $cantidadPagos;
            }

            $contrato->save();
            return $contrato;
            
        }catch (\Exception $e) {
            // Manejar la excepción según tu lógica
            throw ValidationException::withMessages([
                'error' => 'error al guardar contrato', $e->getMessage()
            ]);
        }

    }
    
    public static function validarFechasContrato($fechaInicio,$fechaFin,$regimen){

            // Determinar cantidad de días según el régimen
            // Definir los días por régimen en un array asociativo
            $regimenes = [
                1 => ['dias' => 1,  'nombre' => 'diario (1)'],
                2 => ['dias' => 7,  'nombre' => 'semanal (7)'],
                3 => ['dias' => 15, 'nombre' => 'quincenal (15)'],
                4 => ['dias' => 30, 'nombre' => 'mensual (30)'],
            ];

            $dias_regimen = $regimenes[$regimen]['dias'] ?? 30;
            $regimenNombre = $regimenes[$regimen]['nombre'] ?? 'mensual (30)';

            // Asegurarse de que $fechaInicio y $fechaFin sean objetos DateTime válidos
            if (!($fechaInicio instanceof \DateTime)) {
                if (!is_string($fechaInicio) || !strtotime($fechaInicio)) {
                    throw ValidationException::withMessages([
                        'error' => 'La fecha de inicio no es válida.'
                    ]);
                }
                $fechaInicio = new \DateTime($fechaInicio);
            }
            if (!($fechaFin instanceof \DateTime)) {
                if (!is_string($fechaFin) || !strtotime($fechaFin)) {
                    throw ValidationException::withMessages([
                        'error' => 'La fecha de fin no es válida.'
                    ]);
                }
                $fechaFin = new \DateTime($fechaFin);
            }
            // Calcular la cantidad de pagos en el periodo
            $diffDias = $fechaInicio->diff($fechaFin)->days;

            if ($diffDias % $dias_regimen !== 0) {
                throw ValidationException::withMessages([
                    'error' => "La duración del contrato debe ser múltiplo de la cantidad de días del régimen {$regimenNombre},fechaInicio,fechaFin"
                ]);
            }

    }
    public static function addCalendarioPago($id_contrato, $cantidadPagosEntrada = null)
    {
        // Obtener el contrato para acceder a las fechas y datos necesarios

        try {

            $contrato = \App\Models\Contratos::find($id_contrato);

            if (!$contrato) {
                throw ValidationException::withMessages([
                    'error' => 'Contrato no encontrado con el ID proporcionado.'
                ]);
            }

            $fecha_inicio = new \DateTime($contrato->fecha_inicio);
            $fecha_fin = new \DateTime($contrato->fecha_fin);

            // Obtener id_chofer, monto_pago y regimen_pago desde el modelo contrato
            $id_chofer = $contrato->id_chofer;
            $monto_pago = $contrato->monto;
            $regimen = $contrato->regimen_pago;

            // Determinar cantidad de días según el régimen
            // Definir los días por régimen en un array asociativo
            $regimenes = [
                1 => ['dias' => 1,  'nombre' => 'diario (1)'],
                2 => ['dias' => 7,  'nombre' => 'semanal (7)'],
                3 => ['dias' => 15, 'nombre' => 'quincenal (15)'],
                4 => ['dias' => 30, 'nombre' => 'mensual (30)'],
            ];

            $dias_regimen = $regimenes[$regimen]['dias'] ?? 30;
            $regimenNombre = $regimenes[$regimen]['nombre'] ?? 'mensual (30)';

            // Si el frontend envía una cantidad de pagos (cantidadPagosEntrada), la usamos.
            // Si no, calculamos según el régimen como antes.
            $calendarioPagos = [];

            if ($cantidadPagosEntrada !== null) {
                $cantidadPagos = max(1, intval($cantidadPagosEntrada));

                // Distribuir las fechas uniformemente entre fecha_inicio y fecha_fin
                $intervalDias = intval(floor($fecha_inicio->diff($fecha_fin)->days / max(1, $cantidadPagos - 1)));

                $fecha_pago = clone $fecha_inicio;
                for ($i = 0; $i < $cantidadPagos; $i++) {
                    $calendarioPago = new \App\Models\CalendarioPagos();
                    $calendarioPago->id_chofer = $id_chofer;
                    $calendarioPago->id_contrato = $id_contrato;
                    $calendarioPago->monto_pago = $monto_pago;
                    $calendarioPago->fecha_cobro = $fecha_pago->format('Y-m-d');
                    $calendarioPago->pagado = false;
                    $calendarioPago->activo = true;
                    $calendarioPago->save();

                    $calendarioPagos[] = $calendarioPago;

                    if ($i < $cantidadPagos - 1) {
                        $fecha_pago->modify("+{$intervalDias} days");
                        // Asegurar que no pasemos de fecha_fin
                        if ($fecha_pago > $fecha_fin) {
                            $fecha_pago = clone $fecha_fin;
                        }
                    }
                }
            } else {
                // Comportamiento anterior: calcular según régimen
                $diffDias = $fecha_inicio->diff($fecha_fin)->days;

                if ($diffDias % $dias_regimen !== 0) {
                    throw ValidationException::withMessages([
                        'error' => "La duración del contrato debe ser múltiplo de la cantidad de días del régimen {$regimenNombre},fechaInicio,fechaFin"
                    ]);
                }

                $cantidadPagos = intval(floor($diffDias / $dias_regimen)) + 1;

                $fecha_pago = clone $fecha_inicio;

                for ($i = 0; $i < $cantidadPagos; $i++) {
                    $calendarioPago = new \App\Models\CalendarioPagos();
                    $calendarioPago->id_chofer = $id_chofer;
                    $calendarioPago->id_contrato = $id_contrato;
                    $calendarioPago->monto_pago = $monto_pago;
                    $calendarioPago->fecha_cobro = $fecha_pago->format('Y-m-d');
                    $calendarioPago->pagado = false;
                    $calendarioPago->activo = true;
                    $calendarioPago->save();

                    $calendarioPagos[] = $calendarioPago;

                    // Sumar la cantidad de días del régimen para la próxima fecha de pago
                    $fecha_pago->modify("+{$dias_regimen} days");
                    // No crear pagos fuera del rango de fecha_fin
                    if ($fecha_pago > $fecha_fin) {
                        break;
                    }
                }
            }

            $contrato->cantidad_pagos = $calendarioPagos ? count($calendarioPagos) : 0;
            $contrato->total_pagos = $monto_pago * $contrato->cantidad_pagos;
            $contrato->save();

            return $calendarioPagos;

        } catch (\Exception $e) {
            // Manejar la excepción según tu lógica
            throw ValidationException::withMessages([
                'error' => $e->getMessage()
            ]);
        }
    }
}
