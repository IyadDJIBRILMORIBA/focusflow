<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id',
    'display_name',
    'daily_capacity',
    'streak',
    'last_active',
    'focus_score',
    'theme',
    'language',
    'notifications_enabled',
])]
class Profile extends Model
{
    protected function casts(): array
    {
        return [
            'daily_capacity' => 'integer',
            'streak' => 'integer',
            'focus_score' => 'integer',
            'notifications_enabled' => 'boolean',
            'last_active' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
