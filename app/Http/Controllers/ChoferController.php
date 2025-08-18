<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use App\Models\Chofer;

class ChoferController extends Controller
{
    public static function addChofer(array $validated)
    {

        try {

            $chofer = new Chofer();
            $chofer->nombre_completo = $validated['nombre'];
            $chofer->cedula = $validated['ci'];
            $chofer->telefono = $validated['telefono'];
            $chofer->save();

            return $chofer;

        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage() // 
            ]);
        }
    }
    
}
