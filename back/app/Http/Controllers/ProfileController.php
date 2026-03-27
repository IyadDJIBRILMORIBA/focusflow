<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->profile()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => $user->name,
                'daily_capacity' => 480,
                'streak' => 1,
                'last_active' => now(),
                'focus_score' => 0,
                'theme' => 'system',
                'language' => 'fr',
                'notifications_enabled' => true,
            ]
        );

        return response()->json($this->serialize($profile, $user->email));
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'displayName' => ['sometimes', 'nullable', 'string', 'max:120'],
            'dailyCapacity' => ['sometimes', 'integer', 'min:60', 'max:1440'],
            'streak' => ['sometimes', 'integer', 'min:0', 'max:5000'],
            'lastActive' => ['sometimes', 'nullable', 'date'],
            'focusScore' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'theme' => ['sometimes', 'in:light,dark,system'],
            'language' => ['sometimes', 'in:fr,en'],
            'notificationsEnabled' => ['sometimes', 'boolean'],
        ]);

        $profile = $user->profile()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => $user->name,
                'daily_capacity' => 480,
                'streak' => 1,
                'last_active' => now(),
                'focus_score' => 0,
                'theme' => 'system',
                'language' => 'fr',
                'notifications_enabled' => true,
            ]
        );

        $map = [
            'displayName' => 'display_name',
            'dailyCapacity' => 'daily_capacity',
            'streak' => 'streak',
            'lastActive' => 'last_active',
            'focusScore' => 'focus_score',
            'theme' => 'theme',
            'language' => 'language',
            'notificationsEnabled' => 'notifications_enabled',
        ];

        foreach ($map as $payloadKey => $dbKey) {
            if (array_key_exists($payloadKey, $validated)) {
                $profile->{$dbKey} = $validated[$payloadKey];
            }
        }

        $profile->save();

        if ($profile->display_name) {
            $user->name = $profile->display_name;
            $user->save();
        }

        return response()->json($this->serialize($profile->fresh(), $user->email));
    }

    private function serialize(Profile $profile, string $email): array
    {
        return [
            'uid' => (string) $profile->user_id,
            'email' => $email,
            'displayName' => $profile->display_name,
            'dailyCapacity' => $profile->daily_capacity,
            'streak' => $profile->streak,
            'lastActive' => optional($profile->last_active)?->toISOString(),
            'focusScore' => $profile->focus_score,
            'theme' => $profile->theme,
            'language' => $profile->language,
            'notificationsEnabled' => $profile->notifications_enabled,
        ];
    }
}
