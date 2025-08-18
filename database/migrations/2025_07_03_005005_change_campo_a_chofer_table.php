<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE vehiculos ALTER COLUMN valor_compra TYPE integer USING valor_compra::integer');
    }

    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE vehiculos ALTER COLUMN valor_compra TYPE varchar USING valor_compra::varchar');
    }
};
