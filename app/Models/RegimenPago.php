<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RegimenPago extends Model
{
    protected $table = 'regimenes_pago';
    
    protected $fillable = [
        'nombre',
        'codigo',
        'dias',
        'descripcion',
        'activo'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'dias' => 'integer'
    ];

    /**
     * Relación con contratos
     */
    public function contratos(): HasMany
    {
        return $this->hasMany(Contratos::class, 'regimen_pago', 'id');
    }

    /**
     * Scope para obtener solo regímenes activos
     */
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Obtener régimen por código
     */
    public static function porCodigo(string $codigo): ?self
    {
        return static::where('codigo', $codigo)->first();
    }

    /**
     * Obtener mapeo de códigos a IDs para compatibilidad
     */
    public static function getMapeoCodigoId(): array
    {
        return static::pluck('id', 'codigo')->toArray();
    }
}
