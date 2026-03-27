<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $name = trim((string) ($validated['name'] ?? ''));
        if ($name === '') {
            $name = explode('@', $validated['email'])[0] ?: 'Utilisateur';
        }

        $user = User::create([
            'name' => $name,
            'email' => strtolower($validated['email']),
            'password' => $validated['password'],
        ]);

        Profile::create([
            'user_id' => $user->id,
            'display_name' => $name,
            'daily_capacity' => 480,
            'streak' => 1,
            'last_active' => now(),
            'focus_score' => 0,
            'theme' => 'system',
            'language' => 'fr',
            'notifications_enabled' => true,
        ]);

        $token = $user->createToken('focusflow-web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'uid' => (string) $user->id,
                'email' => $user->email,
                'displayName' => $user->name,
                'photoURL' => null,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', strtolower($validated['email']))->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        $token = $user->createToken('focusflow-web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'uid' => (string) $user->id,
                'email' => $user->email,
                'displayName' => $user->name,
                'photoURL' => null,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'uid' => (string) $user->id,
            'email' => $user->email,
            'displayName' => $user->name,
            'photoURL' => null,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
