<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tasks = $request->user()->tasks()->orderBy('deadline')->get();

        return response()->json($tasks->map(fn (Task $task) => $this->serialize($task))->all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'estimatedDuration' => ['required', 'integer', 'min:1', 'max:1440'],
            'deadline' => ['required', 'date'],
            'priority' => ['required', 'in:low,medium,high'],
            'energyRequired' => ['required', 'in:low,medium,high'],
            'category' => ['required', 'in:work,personal,health,other'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'status' => ['required', 'in:pending,in-progress,completed'],
            'completedAt' => ['nullable', 'date'],
            'aiFeedback' => ['nullable', 'string'],
            'isOptimistic' => ['nullable', 'boolean'],
            'subTasks' => ['nullable', 'array'],
            'subTasks.*.title' => ['required_with:subTasks', 'string', 'max:255'],
            'subTasks.*.completed' => ['required_with:subTasks', 'boolean'],
        ]);

        $task = $request->user()->tasks()->create($this->toDatabasePayload($validated));

        return response()->json($this->serialize($task), 201);
    }

    public function update(Request $request, string $taskId): JsonResponse
    {
        $task = $request->user()->tasks()->findOrFail($taskId);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'estimatedDuration' => ['sometimes', 'integer', 'min:1', 'max:1440'],
            'deadline' => ['sometimes', 'date'],
            'priority' => ['sometimes', 'in:low,medium,high'],
            'energyRequired' => ['sometimes', 'in:low,medium,high'],
            'category' => ['sometimes', 'in:work,personal,health,other'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'status' => ['sometimes', 'in:pending,in-progress,completed'],
            'completedAt' => ['sometimes', 'nullable', 'date'],
            'aiFeedback' => ['sometimes', 'nullable', 'string'],
            'isOptimistic' => ['sometimes', 'nullable', 'boolean'],
            'subTasks' => ['sometimes', 'nullable', 'array'],
            'subTasks.*.title' => ['required_with:subTasks', 'string', 'max:255'],
            'subTasks.*.completed' => ['required_with:subTasks', 'boolean'],
        ]);

        $task->fill($this->toDatabasePayload($validated));

        if (array_key_exists('status', $validated) && $validated['status'] === 'completed' && ! array_key_exists('completedAt', $validated)) {
            $task->completed_at = now();
        }

        if (array_key_exists('status', $validated) && $validated['status'] !== 'completed' && ! array_key_exists('completedAt', $validated)) {
            $task->completed_at = null;
        }

        $task->save();

        return response()->json($this->serialize($task->fresh()));
    }

    public function destroy(Request $request, string $taskId): JsonResponse
    {
        $task = $request->user()->tasks()->findOrFail($taskId);
        $task->delete();

        return response()->json(status: 204);
    }

    private function toDatabasePayload(array $validated): array
    {
        $map = [
            'title' => 'title',
            'description' => 'description',
            'estimatedDuration' => 'estimated_duration',
            'deadline' => 'deadline',
            'priority' => 'priority',
            'energyRequired' => 'energy_required',
            'category' => 'category',
            'tags' => 'tags',
            'status' => 'status',
            'completedAt' => 'completed_at',
            'aiFeedback' => 'ai_feedback',
            'isOptimistic' => 'is_optimistic',
            'subTasks' => 'sub_tasks',
        ];

        $result = [];

        foreach ($map as $payloadKey => $dbKey) {
            if (array_key_exists($payloadKey, $validated)) {
                $result[$dbKey] = $validated[$payloadKey];
            }
        }

        return $result;
    }

    private function serialize(Task $task): array
    {
        return [
            'id' => (string) $task->id,
            'userId' => (string) $task->user_id,
            'title' => $task->title,
            'description' => $task->description,
            'estimatedDuration' => $task->estimated_duration,
            'deadline' => optional($task->deadline)?->toISOString(),
            'priority' => $task->priority,
            'energyRequired' => $task->energy_required,
            'category' => $task->category,
            'tags' => $task->tags ?? [],
            'status' => $task->status,
            'createdAt' => optional($task->created_at)?->toISOString(),
            'completedAt' => optional($task->completed_at)?->toISOString(),
            'aiFeedback' => $task->ai_feedback,
            'isOptimistic' => $task->is_optimistic,
            'subTasks' => $task->sub_tasks,
        ];
    }
}
