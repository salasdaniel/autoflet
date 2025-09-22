<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class Contratos extends Model
{
    protected $fillable = [
        'fecha_inicio',
        'fecha_fin',
        'id_chofer',
        'regimen_pago',
        'activo',
        'monto',
        'moneda',
        'id_vehiculo',
        'cantidad_pagos',
        'total_pagos',
        'id_user'
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'activo' => 'boolean',
        'monto' => 'decimal:2'
    ];

    /**
     * Relación con el usuario propietario
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    /**
     * Relación con el chofer
     */
    public function chofer(): BelongsTo
    {
        return $this->belongsTo(Chofer::class, 'id_chofer');
    }

    /**
     * Relación con el vehículo
     */
    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class, 'id_vehiculo');
    }

    /**
     * Relación con calendario de pagos
     */
    public function calendarioPagos(): HasMany
    {
        return $this->hasMany(CalendarioPagos::class, 'id_contrato');
    }

    /**
     * Global scope para filtrar por usuario autenticado
     */
    protected static function booted(): void
    {
        static::addGlobalScope('user', function (Builder $builder) {
            if (Auth::check()) {
                $builder->where('id_user', Auth::id());
            }
        });

        static::creating(function ($contrato) {
            if (Auth::check()) {
                $contrato->id_user = Auth::id();
            }
        });
    }
}
