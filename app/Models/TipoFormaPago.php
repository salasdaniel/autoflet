<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipoFormaPago extends Model
{
    use HasFactory;

    protected $table = 'tipo_forma_pago';

    protected $fillable = [
        'nombre',
    ];
}
