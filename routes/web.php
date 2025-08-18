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
        $totales = DB::table('vehiculos as v')
            ->selectRaw('
            SUM(valor_compra) as total_valorizado,
            COUNT(*) as vehiculos_activos,
            (SELECT COUNT(*) FROM chofers WHERE activo = true) as choferes_activos,
            (SELECT COUNT(*) FROM contratos WHERE activo = true) as contratos_activos
        ')
            ->first();

        return response()->json($totales);
    });

    Route::get('/getTotalPayment', function () {
        $totales = DB::table('calendario_pagos')
            ->selectRaw('
            COALESCE(SUM(monto_pago) FILTER (WHERE pagado = true AND activo = true)::numeric, 0) AS total_pagado,
            COALESCE(SUM(monto_pago) FILTER (WHERE pagado = false AND activo = true)::numeric, 0) AS total_pendiente,
            COUNT(*) FILTER (WHERE pagado = true AND activo = true) AS pagos_cobrados,
            COUNT(*) FILTER (WHERE pagado = false AND activo = true) AS pagos_pendientes
        ')
            ->first();

        return response()->json($totales);
    });

    Route::get('/getPaymentDetails', function () {
        $paymentDetails = DB::table('calendario_pagos as cp')
            ->leftJoin('chofers as c', 'c.id', '=', 'cp.id_chofer')
            ->leftJoin('contratos as ct', 'ct.id', '=', 'cp.id_contrato')
            ->leftJoin('vehiculos as v', 'v.id', '=', 'ct.id_vehiculo')
            ->select([
                'cp.id as id_pago',
                'cp.id_contrato as nro_contrato',
                'c.nombre_completo as chofer',
                DB::raw("CONCAT(v.id, '-', v.modelo) as vehiculo"),
                'v.chapa',
                'cp.monto_pago',
                'ct.moneda',
                'cp.fecha_pago',
                'cp.fecha_cobro',
                'cp.pagado',
                'c.cedula as documento_chofer',
                'ct.activo as contrato_activo'
            ])
            ->get();

        return response()->json($paymentDetails);
    });

    Route::get('/getChofer', function () {
        return \App\Models\Chofer::select('id')
            ->selectRaw("CONCAT(nombre_completo, ' - ', cedula) as nombre_completo")
            ->get();
    });

    Route::get('/getVehiculos', function () {
        return DB::table('vehiculos as v')
            ->leftJoin('chofers as c', 'c.id', '=', 'v.id_chofer')
            ->select('v.*', 'c.nombre_completo', 'c.cedula')
            ->get();
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
