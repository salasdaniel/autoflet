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
        Schema::create('calendario_pagos', function (Blueprint $table) {
            $table->id();
            $table->integer('id_chofer');
            $table->integer('id_contrato');
            $table->decimal('monto_pago', 10, 2);
            $table->date('fecha_cobro');
            $table->date('fecha_pago')->nullable();
            $table->boolean('pagado')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calendario_pagos');
    }
};
