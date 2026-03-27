<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Flow User',
            'email' => 'flow@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'token',
                'user' => ['uid', 'email', 'displayName', 'photoURL'],
            ]);
    }

    public function test_authenticated_user_can_manage_profile_and_tasks(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum');

        $profileResponse = $this->getJson('/api/profile');
        $profileResponse->assertOk()->assertJsonPath('email', $user->email);

        $updatedProfile = $this->putJson('/api/profile', [
            'displayName' => 'Updated Name',
            'dailyCapacity' => 360,
            'theme' => 'dark',
            'language' => 'fr',
            'notificationsEnabled' => true,
        ]);

        $updatedProfile
            ->assertOk()
            ->assertJsonPath('displayName', 'Updated Name')
            ->assertJsonPath('dailyCapacity', 360)
            ->assertJsonPath('theme', 'dark');

        $taskCreate = $this->postJson('/api/tasks', [
            'title' => 'API task',
            'description' => 'A test task',
            'estimatedDuration' => 45,
            'deadline' => now()->addDay()->toISOString(),
            'priority' => 'medium',
            'energyRequired' => 'medium',
            'category' => 'work',
            'tags' => ['api'],
            'status' => 'pending',
        ]);

        $taskCreate
            ->assertCreated()
            ->assertJsonPath('title', 'API task')
            ->assertJsonPath('status', 'pending');

        $taskId = $taskCreate->json('id');

        $taskUpdate = $this->putJson("/api/tasks/{$taskId}", [
            'status' => 'completed',
        ]);

        $taskUpdate
            ->assertOk()
            ->assertJsonPath('status', 'completed');

        $taskList = $this->getJson('/api/tasks');
        $taskList
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $taskId);

        $this->deleteJson("/api/tasks/{$taskId}")->assertNoContent();
    }
}
