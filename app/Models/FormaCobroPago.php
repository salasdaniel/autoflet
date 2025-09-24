<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormaCobroPago extends Model
{
    use HasFactory;

    protected $table = 'forma_cobro_pagos';

    protected $fillable = [
        'id_calendario_pago',
        'tipo_forma_pago_id',
        'banco_destino_id',
        'monto',
        'moneda',
        'nro_comprobante',
        'adjunto',
        'fecha_pago',
        'id_user',
    ];

    public function calendarioPago()
    {
        return $this->belongsTo(CalendarioPagos::class, 'id_calendario_pago');
    }

    public function tipoFormaPago()
    {
        return $this->belongsTo(TipoFormaPago::class, 'tipo_forma_pago_id');
    }

    public function bancoDestino()
    {
        return $this->belongsTo(Banco::class, 'banco_destino_id');
    }
}
