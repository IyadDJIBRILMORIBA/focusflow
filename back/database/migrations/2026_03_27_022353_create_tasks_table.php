<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('estimated_duration');
            $table->timestamp('deadline');
            $table->string('priority', 20);
            $table->string('energy_required', 20)->default('medium');
            $table->string('category', 30)->default('other');
            $table->json('tags')->nullable();
            $table->string('status', 20)->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->text('ai_feedback')->nullable();
            $table->boolean('is_optimistic')->nullable();
            $table->json('sub_tasks')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'deadline']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
