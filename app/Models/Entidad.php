<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entidad extends Model
{
    protected $table = 'entidades';
    
    protected $fillable = [
        'denominacion'
    ];

    /**
     * Relación con bancos
     */
    public function bancos(): HasMany
    {
        return $this->hasMany(Banco::class, 'entidad_id');
    }
}
