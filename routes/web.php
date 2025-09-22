<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
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
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
