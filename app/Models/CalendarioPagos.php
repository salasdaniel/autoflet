<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class CalendarioPagos extends Model
{
    protected $fillable = [
        'id_chofer',
        'id_contrato',
        'monto_pago',
        'fecha_cobro',
        'fecha_pago',
        'pagado',
        'activo',
        'id_user'
    ];

    protected $casts = [
        'monto_pago' => 'decimal:2',
        'fecha_cobro' => 'date',
        'fecha_pago' => 'date',
        'pagado' => 'boolean',
        'activo' => 'boolean'
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
     * Relación con el contrato
     */
    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contratos::class, 'id_contrato');
    }

    /**
     * Relación con forma de cobro pago
     */
    public function formaCobroPago(): HasOne
    {
        return $this->hasOne(FormaCobroPago::class, 'id_calendario_pago');
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

        static::creating(function ($calendarioPago) {
            if (Auth::check()) {
                $calendarioPago->id_user = Auth::id();
            }
        });
    }
}
