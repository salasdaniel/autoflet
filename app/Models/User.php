<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relación con vehículos
     */
    public function vehiculos(): HasMany
    {
        return $this->hasMany(Vehiculo::class, 'id_user');
    }

    /**
     * Relación con choferes
     */
    public function chofers(): HasMany
    {
        return $this->hasMany(Chofer::class, 'id_user');
    }

    /**
     * Relación con contratos
     */
    public function contratos(): HasMany
    {
        return $this->hasMany(Contratos::class, 'id_user');
    }

    /**
     * Relación con calendario de pagos
     */
    public function calendarioPagos(): HasMany
    {
        return $this->hasMany(CalendarioPagos::class, 'id_user');
    }

    /**
     * Relación con bancos
     */
    public function bancos(): HasMany
    {
        return $this->hasMany(Banco::class, 'id_user');
    }
}
