const prompts = require('../prompts/templates');
const gemini = require('./gemini');
const memoryService = require('./memory');
const prisma = require('../config/db');

async function getModuleContext(userId, module, promptTemplate) {
    const recentMemories = await memoryService.getRecentMemories(userId, module, 20);
    const upcomingMemories = await memoryService.getUpcomingMemories(userId, module, 10);
    
    const recentText = recentMemories.map(m => `[LOG: ${m.createdAt}] ${m.rawText}`).join('\n');
    const upcomingText = upcomingMemories.map(m => `[UPCOMING: ${m.eventDate}] ${m.rawText}`).join('\n');

    const memoryText = `Recent Logs:\n${recentText}\n\nUpcoming Deadlines/Events:\n${upcomingText}`;
    
    const prompt = promptTemplate
        .replace('{{CURRENT_DATE}}', new Date().toISOString())
        .replace('{{RETRIEVED_MEMORIES}}', memoryText);

    return await gemini.generateText(prompt);
}

async function generateDailyPlan(userId, date, userIntent) {
    // 1. Gather Context in parallel
    const [uniSummary, fitnessSummary, workSummary] = await Promise.all([
        getModuleContext(userId, 'UNI', prompts.UNI_CONTEXT),
        getModuleContext(userId, 'FITNESS', prompts.FITNESS_CONTEXT),
        getModuleContext(userId, 'WORK', prompts.WORK_CONTEXT)
    ]);

    // 2. Coordinator
    const coordinatorPrompt = prompts.COORDINATOR
        .replace('{{UNI_SUMMARY}}', uniSummary)
        .replace('{{FITNESS_RECOMMENDATION}}', fitnessSummary)
        .replace('{{WORK_SUMMARY}}', workSummary)
        .replace('{{USER_QUERY}}', userIntent || "Plan my day optimally.");

    const dailyPlan = await gemini.generateJSON(coordinatorPrompt);

    // 3. Save Schedule
    const schedule = await prisma.schedule.create({
        data: {
            userId,
            targetDate: new Date(date),
            dailyPlan,
        }
    });

    return schedule;
}

module.exports = {
    generateDailyPlan
};

