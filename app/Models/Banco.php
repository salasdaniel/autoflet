<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class Banco extends Model
{
    protected $fillable = [
        'entidad_id',
        'numero_cuenta',
        'moneda',
        'titular_nombre',
        'titular_documento',
        'alias',
        'tipo_alias',
        'id_user'
    ];

    /**
     * Relación con entidad bancaria
     */
    public function entidad(): BelongsTo
    {
        return $this->belongsTo(Entidad::class, 'entidad_id');
    }

    /**
     * Relación con el usuario propietario
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
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

        static::creating(function ($banco) {
            if (Auth::check()) {
                $banco->id_user = Auth::id();
            }
        });
    }
}
