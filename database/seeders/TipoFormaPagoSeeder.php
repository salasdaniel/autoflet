<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TipoFormaPago;

class TipoFormaPagoSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            'EFECTIVO',
            'TRANSFERENCIA',
            'POS',
            'CHEQUE',
            'OTRO',
        ];

        foreach ($items as $name) {
            TipoFormaPago::firstOrCreate(['nombre' => $name]);
        }
    }
}
