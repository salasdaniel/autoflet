<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forma_cobro_pagos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_calendario_pago');
            $table->unsignedBigInteger('tipo_forma_pago_id');
            $table->unsignedBigInteger('banco_destino_id')->nullable();
            $table->decimal('monto', 15, 2);
            $table->string('moneda', 10)->default('PYG');
            $table->string('nro_comprobante')->nullable();
            $table->string('adjunto')->nullable();
            $table->timestamp('fecha_pago')->nullable();
            $table->unsignedBigInteger('id_user')->nullable();
            $table->timestamps();

            $table->foreign('id_calendario_pago')->references('id')->on('calendario_pagos')->onDelete('cascade');
            $table->foreign('tipo_forma_pago_id')->references('id')->on('tipo_forma_pago')->onDelete('restrict');
            $table->foreign('banco_destino_id')->references('id')->on('bancos')->onDelete('set null');
            $table->foreign('id_user')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forma_cobro_pagos');
    }
};
