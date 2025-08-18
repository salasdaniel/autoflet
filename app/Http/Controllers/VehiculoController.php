<?php

namespace App\Http\Controllers;

use Illuminate\Validation\ValidationException;

use Illuminate\Http\Request;
use App\Models\Vehiculo;
use App\Models\Chofer;
use Illuminate\Support\Facades\DB;

class VehiculoController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'chapa' => 'required',
            'modelo' => 'required',
            'color' => 'required',
            'valor' => 'required|numeric',
            'fechaCompra' => 'required|date',
            'nuevoChofer' => 'nullable|boolean', // para saber si se va a crear un nuevo chofer o no
            'id_chofer' => 'nullable|string',
            'nombre' => 'nullable|string',
            'ci' => 'nullable|string',
            'telefono' => 'nullable|string',
            'fechaInicio' => 'required|date',
            'fechaFin' => 'required|date|after_or_equal:fechaInicio',
            'regimenPago' => 'required|numeric',
            'montoContrato' => 'required|numeric|min:0', // Monto del contrato, si se proporciona
        ]);

        // dd($request);

        try {
            DB::beginTransaction();

            $nuevoChofer = $request->nuevoChofer;

            PagosController::validarFechasContrato($validated['fechaInicio'], $validated['fechaFin'], $validated['regimenPago']);

            // --dd($request->all(), $nuevoChofer);
            if ($nuevoChofer) {

                $camposConError = [];

                if (!$request->filled('nombre')) $camposConError[] = 'nombre';
                if (!$request->filled('ci'))     $camposConError[] = 'ci';
                if (!$request->filled('telefono')) $camposConError[] = 'telefono';


                if ($request->filled(['nombre', 'ci', 'telefono'])) {
                    $chofer = new Chofer();
                    $chofer->nombre_completo = $request->nombre;
                    $chofer->cedula = $request->ci;
                    $chofer->telefono = $request->telefono;
                    $chofer->save();
                    $request->merge(['id_chofer' => $chofer->id]);

                    // dd('Entra en 1', $request->all());
                } else {
                    // dd('Entra en 2', $request->all());
                    //dd($errores);
                    // throw ValidationException::withMessages([
                    //     'error' => $errores
                    // ]);
                    $camposConError = implode(',', $camposConError); // ej: "nombre,ci,telefono"

                    throw ValidationException::withMessages([
                        'error' => $camposConError // ej: "nombre,ci,telefono"
                    ]);
                }
            }

            if (!$nuevoChofer && !$request->filled('id_chofer')) {
                // dd('Entra en 3', $request->all());
                throw ValidationException::withMessages([
                    'error' => 'id_chofer'
                ]);
            }



            if ($request->filled(['id_chofer'])) {
                // dd('Entra en 4', $request->all());
                $vehiculo = new Vehiculo();
                $vehiculo->chapa = $validated['chapa'];
                $vehiculo->modelo = $validated['modelo'];
                $vehiculo->color = $validated['color'];
                $vehiculo->fecha_compra = \Carbon\Carbon::parse($validated['fechaCompra']);
                $vehiculo->valor_compra = (int) $validated['valor'];
                $vehiculo->id_chofer = (int) $request->id_chofer;
                $vehiculo->save();
                DB::commit();

                // Crear el contrato y obtener el objeto Contrato
                $contrato = PagosController::addContrato(
                    $validated['fechaInicio'],
                    $validated['fechaFin'],
                    $vehiculo->id_chofer,
                    $validated['regimenPago'],
                    $validated['montoContrato'],
                    $vehiculo->id // Pasar el ID del vehículo al contrato
                );

                // Ahora puedes acceder al ID del contrato creado
                // $dd('Contrato creado con ID:', $contrato->id);
                PagosController::addCalendarioPago($contrato->id);

                return to_route('pagos')->with('success', 'Vehículo agregado correctamente.');
            } else {
                // Si por alguna razón no hay id_chofer, error
                // dd('Entra en 5', $request->all());
                throw ValidationException::withMessages([
                    'error' => 'No se pudo asignar un chofer al vehículo.'
                ]);
            }
            // Si el chofer ya existe, se asigna su ID al vehículo

            // dd('Entra en 6', $request->all());
            // throw ValidationException::withMessages([
            //     'error' => 'No se pudo asignar un chofer al vehículo.'
            // ]);
        } catch (\Exception $e) {
            DB::rollBack();
            // dd('Entra en 7', $request->all(), $e->getMessage());
            throw ValidationException::withMessages([
                'error' => $e->getMessage()
            ]);
        }
    }

    public function updateOrCreate(Request $request)
    {
        $validated = $request->validate([
            'nuevoChofer' => 'required|boolean', // para saber si se va a crear un nuevo chofer o no
            'id_chofer' => 'nullable|string',
            'nombre' => 'nullable|string',
            'ci' => 'nullable|string',
            'telefono' => 'nullable|string',
            'id_vehiculo' => 'nullable|numeric'
        ]);

        try {

            if ($validated['nuevoChofer']) {
                $chofer = ChoferController::addChofer($validated);
                VehiculoController::updateChofer($validated['id_vehiculo'], $chofer->id);
            } else {

                if ($validated['id_chofer']) {
                    VehiculoController::updateChofer($validated['id_vehiculo'], $validated['id_chofer'],);
                } else {
                    throw ValidationException::withMessages([
                        'error' => 'Error al recuperar el Chofer' // 
                    ]);
                }
            }

            return to_route('pagos')->with('success', 'Chofer cambiado exitosamente');

        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage()
            ]);
        }
    }

    public static function updateChofer($id_vehiculo, $id_chofer)
    {
        try {

            $vehiculo = Vehiculo::findOrFail($id_vehiculo);
            $vehiculo->id_chofer = $id_chofer;
            $vehiculo->save();
            return $vehiculo;
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage()
            ]);
        }
    }
}
