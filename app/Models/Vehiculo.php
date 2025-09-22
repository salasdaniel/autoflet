<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class Vehiculo extends Model
{
    protected $fillable = [
        'chapa',
        'modelo',
        'color',
        'valor_compra',
        'fecha_compra',
        'id_chofer',
        'id_user'
    ];

    protected $casts = [
        'fecha_compra' => 'datetime',
        'valor_compra' => 'decimal:2'
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
     * Global scope para filtrar por usuario autenticado
     */
    protected static function booted(): void
    {
        static::addGlobalScope('user', function (Builder $builder) {
            if (Auth::check()) {
                $builder->where('id_user', Auth::id());
            }
        });

        static::creating(function ($vehiculo) {
            if (Auth::check()) {
                $vehiculo->id_user = Auth::id();
            }
        });
    }
}
