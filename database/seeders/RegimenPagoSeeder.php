<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RegimenPagoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regimenes = [
            [
                'id' => 1,
                'nombre' => 'Diario',
                'codigo' => 'DIARIO',
                'dias' => 1,
                'descripcion' => 'Pago diario (cada día)',
                'activo' => true,
            ],
            [
                'id' => 2,
                'nombre' => 'Semanal',
                'codigo' => 'SEMANAL',
                'dias' => 7,
                'descripcion' => 'Pago semanal (cada 7 días)',
                'activo' => true,
            ],
            [
                'id' => 3,
                'nombre' => 'Quincenal',
                'codigo' => 'QUINCENAL',
                'dias' => 15,
                'descripcion' => 'Pago quincenal (cada 15 días)',
                'activo' => true,
            ],
            [
                'id' => 4,
                'nombre' => 'Mensual',
                'codigo' => 'MENSUAL',
                'dias' => 30,
                'descripcion' => 'Pago mensual (cada 30 días)',
                'activo' => true,
            ],
        ];

        foreach ($regimenes as $regimen) {
            DB::table('regimenes_pago')->updateOrInsert(
                ['id' => $regimen['id']],
                [
                    'nombre' => $regimen['nombre'],
                    'codigo' => $regimen['codigo'],
                    'dias' => $regimen['dias'],
                    'descripcion' => $regimen['descripcion'],
                    'activo' => $regimen['activo'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
