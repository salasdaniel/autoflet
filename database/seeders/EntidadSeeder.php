<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EntidadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $entidades = [
            'Banco Itaú Paraguay',
            'Banco Continental',
            'Sudameris Bank',
            'Banco Nacional de Fomento (BNF)',
            'Banco GNB Paraguay',
            'Banco BASA',
            'Bancop',
            'Banco Atlas-Familiar',
            'Interfisa Banco',
            'Banco Río',
            'Solar Banco',
            'Ueno Bank',
            'Zeta Banco',
            'Financiera Paraguayo Japonesa',
            'Financiera FIC',
            'Tu Financiera',
            'Cooperativa Universitaria',
            'Cooperativa Multiactiva San Lorenzo',
            'Cooperativa Medalla Milagrosa',
            'Cooperativa Chortitzer',
            'Cooperativa Ñemby',
            'Cooperativa Nazareth'
        ];

        foreach ($entidades as $denominacion) {
            \App\Models\Entidad::create([
                'denominacion' => $denominacion
            ]);
        }
    }
}
