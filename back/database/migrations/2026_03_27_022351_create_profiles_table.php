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
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('display_name')->nullable();
            $table->unsignedInteger('daily_capacity')->default(480);
            $table->unsignedInteger('streak')->default(1);
            $table->timestamp('last_active')->nullable();
            $table->unsignedInteger('focus_score')->default(0);
            $table->string('theme', 20)->default('system');
            $table->string('language', 5)->default('fr');
            $table->boolean('notifications_enabled')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
