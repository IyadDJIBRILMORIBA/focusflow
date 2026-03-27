<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id',
    'title',
    'description',
    'estimated_duration',
    'deadline',
    'priority',
    'energy_required',
    'category',
    'tags',
    'status',
    'completed_at',
    'ai_feedback',
    'is_optimistic',
    'sub_tasks',
])]
class Task extends Model
{
    protected function casts(): array
    {
        return [
            'estimated_duration' => 'integer',
            'deadline' => 'datetime',
            'completed_at' => 'datetime',
            'tags' => 'array',
            'sub_tasks' => 'array',
            'is_optimistic' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
