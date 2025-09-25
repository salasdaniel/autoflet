<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Http\Controllers\VehiculoController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('pagos', function () {
        return Inertia::render('pagos');
    })->name('pagos');

    Route::get('paymentsDetails', function () {
        return Inertia::render('payments');
    })->name('payments');

    Route::get('formulario', function () {
        return Inertia::render('formulario');
    })->name('formulario');


    Route::post('/vehiculos', [VehiculoController::class, 'store'])->name('vehiculo.store');
    Route::post('/updateVehiculoChofer', [VehiculoController::class, 'updateOrCreate'])->name('vehiculo.updateOrCreate');

    // apis 

    Route::get('/getTotalesVehiculos', function () {
        $totales = [
            'total_valorizado' => \App\Models\Vehiculo::sum('valor_compra'),
            'vehiculos_activos' => \App\Models\Vehiculo::count(),
            'choferes_activos' => \App\Models\Chofer::count(),
            'contratos_activos' => \App\Models\Contratos::where('activo', true)->count()
        ];

        return response()->json($totales);
    });

    Route::get('/getTotalPayment', function () {
        $totales = [
            'total_pagado' => \App\Models\CalendarioPagos::where('pagado', true)->where('activo', true)->sum('monto_pago'),
            'total_pendiente' => \App\Models\CalendarioPagos::where('pagado', false)->where('activo', true)->sum('monto_pago'),
            'pagos_cobrados' => \App\Models\CalendarioPagos::where('pagado', true)->where('activo', true)->count(),
            'pagos_pendientes' => \App\Models\CalendarioPagos::where('pagado', false)->where('activo', true)->count()
        ];

        return response()->json($totales);
    });

    Route::get('/getPaymentDetails', function () {
        return \App\Models\CalendarioPagos::with(['chofer', 'contrato.vehiculo'])
            ->get()
            ->map(function($pago) {
                return [
                    'id_pago' => $pago->id,
                    'nro_contrato' => $pago->id_contrato,
                    'chofer' => $pago->chofer ? $pago->chofer->nombre_completo : null,
                    'vehiculo' => $pago->contrato && $pago->contrato->vehiculo ? 
                        $pago->contrato->vehiculo->id . '-' . $pago->contrato->vehiculo->modelo : null,
                    'chapa' => $pago->contrato && $pago->contrato->vehiculo ? $pago->contrato->vehiculo->chapa : null,
                    'monto_pago' => $pago->monto_pago,
                    'moneda' => $pago->contrato ? $pago->contrato->moneda : 'PYG',
                    'fecha_pago' => $pago->fecha_pago,
                    'fecha_cobro' => $pago->fecha_cobro,
                    'pagado' => $pago->pagado,
                    'documento_chofer' => $pago->chofer ? $pago->chofer->cedula : null,
                    'contrato_activo' => $pago->contrato ? $pago->contrato->activo : false
                ];
            });
    });

    Route::get('/getChofer', function () {
        return \App\Models\Chofer::select('id')
            ->selectRaw("CONCAT(nombre_completo, ' - ', cedula) as nombre_completo")
            ->get();
    });

    Route::get('/getVehiculos', function () {
        $userId = \Illuminate\Support\Facades\Auth::id();
        // \Illuminate\Support\Facades\Log::info('Usuario autenticado en /getVehiculos: ' . $userId);
        
        $vehiculos = \App\Models\Vehiculo::with('chofer')
            ->where('id_user',$userId)
            ->get();
        // \Illuminate\Support\Facades\Log::info('Cantidad de vehículos obtenidos: ' . $vehiculos->count());
        
        return $vehiculos->map(function($vehiculo) {
            return [
                'id' => $vehiculo->id,
                'chapa' => $vehiculo->chapa,
                'modelo' => $vehiculo->modelo,
                'color' => $vehiculo->color,
                'valor_compra' => $vehiculo->valor_compra,
                'fecha_compra' => $vehiculo->fecha_compra,
                'id_chofer' => $vehiculo->id_chofer,
                'nombre_completo' => $vehiculo->chofer ? $vehiculo->chofer->nombre_completo : null,
                'cedula' => $vehiculo->chofer ? $vehiculo->chofer->cedula : null,
                'id_user' => $vehiculo->id_user
            ];
        });
    });

    // Rutas para manejo de bancos
    Route::get('/getBancos', function () {
        $userId = \Illuminate\Support\Facades\Auth::id();
        
        return \App\Models\Banco::with('entidad')
            ->where('id_user', $userId)
            ->get()
            ->map(function($banco) {
                return [
                    'id' => $banco->id,
                    'entidad_id' => $banco->entidad_id,
                    'entidad_nombre' => $banco->entidad ? $banco->entidad->denominacion : null,
                    'numero_cuenta' => $banco->numero_cuenta,
                    'moneda' => $banco->moneda,
                    'titular_nombre' => $banco->titular_nombre,
                    'titular_documento' => $banco->titular_documento,
                    'alias' => $banco->alias,
                    'tipo_alias' => $banco->tipo_alias,
                    'id_user' => $banco->id_user
                ];
            });
    });

    Route::get('/getEntidades', function () {
        return \App\Models\Entidad::select('id', 'denominacion')
            ->orderBy('denominacion')
            ->get();
    });

    // Tipos de fo4 cobro y endpoint para registrar pagos
    Route::get('/tipoFormasPago', [\App\Http\Controllers\PagoController::class, 'tipos']);
    Route::post('/formaCobroPagos', [\App\Http\Controllers\PagoController::class, 'store']);
    Route::get('/getPaymentDetail/{idCalendarioPago}', [\App\Http\Controllers\PagoController::class, 'getPaymentDetail']);

    // Endpoint para reporte de ingresos
    Route::get('/getIngresosData', function () {
        try {
            $pagos = \App\Models\CalendarioPagos::with([
                    'chofer', 
                    'contrato.vehiculo'
                ])
                ->where('pagado', true)
                ->where('activo', true)
                ->get();
            
            \Illuminate\Support\Facades\Log::info('Cantidad de pagos encontrados: ' . $pagos->count());
            
            return $pagos->map(function($pago) {
                // Buscar la forma de cobro por separado para evitar problemas de relación
                $formaCobroPago = \App\Models\FormaCobroPago::with('tipoFormaPago')
                    ->where('id_calendario_pago', $pago->id)
                    ->first();
                
                $formaPago = $formaCobroPago && $formaCobroPago->tipoFormaPago 
                    ? $formaCobroPago->tipoFormaPago->nombre 
                    : 'EFECTIVO'; // Asumimos efectivo si no hay registro

                return [
                    'id' => $pago->id,
                    'fecha' => $pago->fecha_pago ?? $pago->fecha_cobro,
                    'concepto' => 'Pago mensual contrato #' . $pago->id_contrato,
                    'chofer' => $pago->chofer ? $pago->chofer->nombre_completo : 'N/A',
                    'vehiculo' => $pago->contrato && $pago->contrato->vehiculo ? 
                        $pago->contrato->vehiculo->modelo : 'N/A',
                    'chapa' => $pago->contrato && $pago->contrato->vehiculo ? 
                        $pago->contrato->vehiculo->chapa : 'N/A',
                    'nro_contrato' => $pago->id_contrato,
                    'monto' => $pago->monto_pago,
                    'moneda' => $pago->contrato ? $pago->contrato->moneda : 'PYG',
                    'forma_pago' => $formaPago,
                    'tipo' => 'PAGO',
                    'estado' => 'CONFIRMADO'
                ];
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error en getIngresosData: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    });

    // Endpoint para totales de ingresos
    Route::get('/getTotalesIngresos', function () {
        try {
            $totalIngresos = \App\Models\CalendarioPagos::where('pagado', true)
                ->where('activo', true)
                ->sum('monto_pago');
            
            $cantidadTransacciones = \App\Models\CalendarioPagos::where('pagado', true)
                ->where('activo', true)
                ->count();

            // Obtener totales por tipo de forma de pago
            $ingresosEfectivo = \App\Models\CalendarioPagos::where('calendario_pagos.pagado', true)
                ->where('calendario_pagos.activo', true)
                ->leftJoin('forma_cobro_pagos', 'calendario_pagos.id', '=', 'forma_cobro_pagos.calendario_pago_id')
                ->leftJoin('tipo_forma_pagos', 'forma_cobro_pagos.tipo_forma_pago_id', '=', 'tipo_forma_pagos.id')
                ->where(function ($query) {
                    $query->where('tipo_forma_pagos.nombre', 'EFECTIVO')
                          ->orWhereNull('tipo_forma_pagos.nombre'); // Asumir efectivo si no hay registro
                })
                ->sum('calendario_pagos.monto_pago');

            $ingresosTransferencia = \App\Models\CalendarioPagos::where('calendario_pagos.pagado', true)
                ->where('calendario_pagos.activo', true)
                ->leftJoin('forma_cobro_pagos', 'calendario_pagos.id', '=', 'forma_cobro_pagos.calendario_pago_id')
                ->leftJoin('tipo_forma_pagos', 'forma_cobro_pagos.tipo_forma_pago_id', '=', 'tipo_forma_pagos.id')
                ->where('tipo_forma_pagos.nombre', 'TRANSFERENCIA')
                ->sum('calendario_pagos.monto_pago');

            $ingresosPOS = \App\Models\CalendarioPagos::where('calendario_pagos.pagado', true)
                ->where('calendario_pagos.activo', true)
                ->leftJoin('forma_cobro_pagos', 'calendario_pagos.id', '=', 'forma_cobro_pagos.calendario_pago_id')
                ->leftJoin('tipo_forma_pagos', 'forma_cobro_pagos.tipo_forma_pago_id', '=', 'tipo_forma_pagos.id')
                ->where('tipo_forma_pagos.nombre', 'POS')
                ->sum('calendario_pagos.monto_pago');

            return [
                'total_ingresos' => $totalIngresos,
                'ingresos_efectivo' => $ingresosEfectivo ?: 0,
                'ingresos_transferencia' => $ingresosTransferencia ?: 0,
                'ingresos_pos' => $ingresosPOS ?: 0,
                'cantidad_transacciones' => $cantidadTransacciones
            ];
        } catch (\Exception $e) {
            Log::error('Error in getTotalesIngresos:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            return [
                'total_ingresos' => 0,
                'ingresos_efectivo' => 0,
                'ingresos_transferencia' => 0,
                'ingresos_pos' => 0,
                'cantidad_transacciones' => 0
            ];
        }
    });

    Route::post('/bancos', function (Illuminate\Http\Request $request) {
        $request->validate([
            'entidad_id' => 'required|exists:entidades,id',
            'numero_cuenta' => 'required|string|max:255',
            'moneda' => 'required|string|max:255',
            'titular_nombre' => 'required|string|max:255',
            'titular_documento' => 'required|string|max:255',
            'alias' => 'required|string|max:255',
            'tipo_alias' => 'required|string|max:255',
        ]);

        \App\Models\Banco::create($request->all());

        return redirect()->back()->with('success', 'Banco creado exitosamente');
    });

    Route::put('/bancos/{banco}', function (Illuminate\Http\Request $request, \App\Models\Banco $banco) {
        $request->validate([
            'entidad_id' => 'required|exists:entidades,id',
            'numero_cuenta' => 'required|string|max:255',
            'moneda' => 'required|string|max:255',
            'titular_nombre' => 'required|string|max:255',
            'titular_documento' => 'required|string|max:255',
            'alias' => 'required|string|max:255',
            'tipo_alias' => 'required|string|max:255',
        ]);

        $banco->update($request->all());

        return redirect()->back()->with('success', 'Banco actualizado exitosamente');
    });

    Route::delete('/bancos/{banco}', function (\App\Models\Banco $banco) {
        $banco->delete();

        return redirect()->back()->with('success', 'Banco eliminado exitosamente');
    });

    Route::get('bancos', function () {
        return Inertia::render('bancos');
    })->name('bancos');

    Route::get('reporteIngresos', function () {
        return Inertia::render('ingresos');
    })->name('reporteIngresos');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
