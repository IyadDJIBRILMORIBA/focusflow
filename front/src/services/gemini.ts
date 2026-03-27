import { GoogleGenAI } from "@google/genai";

const geminiApiKey = (process.env.GEMINI_API_KEY ?? '').trim();
let missingApiKeyWarningShown = false;

function getGenAIClient() {
  if (!geminiApiKey) {
    if (!missingApiKeyWarningShown) {
      console.warn('GEMINI_API_KEY is missing. AI features are disabled until the key is configured.');
      missingApiKeyWarningShown = true;
    }
    return null;
  }

  return new GoogleGenAI({ apiKey: geminiApiKey });
}

export async function runRealityCheck(title: string, duration: number, description?: string) {
  try {
    const genAI = getGenAIClient();
    if (!genAI) return null;

    const model = "gemini-3-flash-preview";
    const prompt = `Agis comme un expert en productivité. Analyse cette tâche :
    Titre : ${title}
    Durée estimée : ${duration} minutes
    Description : ${description || 'N/A'}
    
    Dis-moi si l'estimation de temps semble réaliste ou trop optimiste. Réponds en français avec :
    1. Un verdict (Réaliste / Optimiste)
    2. Une explication de 15 mots max.`;

    const response = await genAI.models.generateContent({
      model,
      contents: prompt
    });

    const text = response.text;
    const isOptimistic = text.toLowerCase().includes('optimiste');
    return { feedback: text, isOptimistic };
  } catch (error) {
    console.error("Reality check failed", error);
    return null;
  }
}

export async function decomposeTask(taskTitle: string, duration: number) {
  try {
    const genAI = getGenAIClient();
    if (!genAI) return null;

    const model = "gemini-3-flash-preview";
    const prompt = `Décompose cette tâche en 3 à 5 sous-tâches concrètes :
    Tâche : ${taskTitle}
    Durée totale : ${duration} minutes
    
    Réponds uniquement avec une liste JSON d'objets { "title": string, "completed": false }.`;

    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Decomposition failed", error);
    return null;
  }
}

export async function generateBriefing(tasks: any[], capacity: number, energy: string, streak: number) {
  try {
    const genAI = getGenAIClient();
    if (!genAI) return null;

    const model = "gemini-3-flash-preview";
    const prompt = `Agis comme un copilote de productivité. Voici les tâches d'aujourd'hui :
    ${tasks.map(t => `- ${t.title} (${t.estimatedDuration}min, priorité ${t.priority})`).join('\n')}
    Capacité totale : ${capacity}min.
    Énergie actuelle de l'utilisateur : ${energy === 'low' ? 'Basse (fatigué)' : energy === 'high' ? 'Haute (en forme)' : 'Moyenne'}.
    Streak actuel : ${streak} jours.
    
    Donne un briefing ultra-court (1 phrase, max 25 mots) en français qui motive et prévient des risques de surcharge.`;

    const response = await genAI.models.generateContent({
      model,
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Briefing generation failed", error);
    return null;
  }
}

export async function generateRetrospective(completedTasks: any[]) {
  try {
    const genAI = getGenAIClient();
    if (!genAI) return null;

    const model = "gemini-3-flash-preview";
    const prompt = `Analyse la performance de l'utilisateur cette semaine :
    Tâches terminées : ${completedTasks.length}
    Temps total investi : ${completedTasks.reduce((acc, t) => acc + t.estimatedDuration, 0)}min
    
    Donne un bilan de coach (2 phrases, max 40 mots) en français. Sois encourageant mais honnête sur la régularité.`;

    const response = await genAI.models.generateContent({
      model,
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Retrospective generation failed", error);
    return null;
  }
}
