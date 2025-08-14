import { useState, useEffect } from 'react';

interface AgentTask {
  id: string;
  agentId: string;
  status: string;
  result?: any;
  agentName?: string;
  completedAt?: string;
}

export function useAgentResults(taskIds: string[]) {
  const [results, setResults] = useState<Record<string, AgentTask>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskIds || taskIds.length === 0) return;

    const pollResults = async () => {
      try {
        const promises = taskIds.map(async (taskId) => {
          const response = await fetch(`/api/agents/task-results/${taskId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.ok && data.task) {
              return { taskId, task: data.task };
            }
          }
          return { taskId, task: null };
        });

        const taskResults = await Promise.all(promises);
        const newResults: Record<string, AgentTask> = {};
        
        taskResults.forEach(({ taskId, task }) => {
          if (task) {
            newResults[taskId] = task;
          }
        });

        setResults(prev => ({ ...prev, ...newResults }));
        
        // Check if all tasks are completed
        const completedCount = Object.values(newResults).filter(task => task.status === 'completed').length;
        if (completedCount === taskIds.length) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to poll agent results:', error);
      }
    };

    // Poll immediately
    pollResults();

    // Set up polling interval
    const interval = setInterval(pollResults, 2000);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [taskIds]);

  return { results, loading };
}