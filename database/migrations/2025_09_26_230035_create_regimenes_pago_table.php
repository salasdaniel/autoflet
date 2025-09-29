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
        Schema::create('regimenes_pago', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique(); // DIARIO, SEMANAL, QUINCENAL, MENSUAL
            $table->string('codigo', 20)->unique(); // DIARIO, SEMANAL, QUINCENAL, MENSUAL
            $table->integer('dias'); // 1, 7, 15, 30
            $table->string('descripcion', 100)->nullable(); // descripción completa
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('regimenes_pago');
    }
};
