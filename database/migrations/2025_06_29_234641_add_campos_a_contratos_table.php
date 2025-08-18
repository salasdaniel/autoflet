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
        Schema::table('contratos', function (Blueprint $table) {
            $table->integer('id_vehiculo')->nullable(); // o ajusta el after según tu estructura
            $table->integer('cantidad_pagos')->nullable();
            $table->integer('total_pagos')->nullable();
            //
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contratos', function (Blueprint $table) {
            $table->dropColumn(['id_vehiculo', 'cantidad_pagos', 'total_pagos']);
        });
    }
};
