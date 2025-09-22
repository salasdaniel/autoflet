<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class Chofer extends Model
{
    protected $fillable = [
        'nombre_completo',
        'cedula',
        'telefono',
        'id_user'
    ];

    /**
     * Relación con el usuario propietario
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    /**
     * Relación con vehículos
     */
    public function vehiculos(): HasMany
    {
        return $this->hasMany(Vehiculo::class, 'id_chofer');
    }

    /**
     * Relación con contratos
     */
    public function contratos(): HasMany
    {
        return $this->hasMany(Contratos::class, 'id_chofer');
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

        static::creating(function ($chofer) {
            if (Auth::check()) {
                $chofer->id_user = Auth::id();
            }
        });
    }
}
