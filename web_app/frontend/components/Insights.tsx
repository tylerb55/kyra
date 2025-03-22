'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Dummy data for the charts
const dummyTimelineData = {
  dates: ['Jan 1', 'Jan 8', 'Jan 15', 'Jan 22', 'Jan 29', 'Feb 5', 'Feb 12'],
  symptoms: {
    'Headache': [3, 5, 2, 4, 3, 1, 2],
    'Fatigue': [4, 4, 3, 5, 4, 3, 2],
    'Nausea': [1, 0, 2, 3, 1, 0, 0],
    'Joint Pain': [2, 3, 4, 4, 3, 2, 1]
  }
};

const dummyFrequencyData = {
  symptoms: ['Headache', 'Fatigue', 'Nausea', 'Joint Pain', 'Dizziness', 'Fever'],
  frequencies: [28, 35, 15, 22, 8, 12]
};

const dummyTopicData = {
  topics: ['Medication', 'Symptoms', 'Diet', 'Exercise', 'Sleep', 'Mental Health'],
  counts: [25, 40, 15, 10, 8, 12]
};

const Insights = () => {
  const [activeTab, setActiveTab] = useState('timeline');

  // Prepare chart data
  const timelineChartData = {
    labels: dummyTimelineData.dates,
    datasets: Object.entries(dummyTimelineData.symptoms).map(([symptom, values], index) => ({
      label: symptom,
      data: values,
      borderColor: getColor(index),
      backgroundColor: getColor(index, 0.2),
      tension: 0.3,
    })),
  };

  const frequencyChartData = {
    labels: dummyFrequencyData.symptoms,
    datasets: [{
      label: 'Frequency',
      data: dummyFrequencyData.frequencies,
      backgroundColor: dummyFrequencyData.symptoms.map((_, i) => getColor(i, 0.7)),
      borderColor: dummyFrequencyData.symptoms.map((_, i) => getColor(i)),
      borderWidth: 1,
    }],
  };

  const topicChartData = {
    labels: dummyTopicData.topics,
    datasets: [{
      data: dummyTopicData.counts,
      backgroundColor: dummyTopicData.topics.map((_, i) => getColor(i, 0.7)),
      borderColor: dummyTopicData.topics.map((_, i) => getColor(i)),
      borderWidth: 1,
    }],
  };

  // Helper function to generate colors
  function getColor(index: number, alpha = 1) {
    const colors = [
      `rgba(255, 99, 132, ${alpha})`,
      `rgba(54, 162, 235, ${alpha})`,
      `rgba(255, 206, 86, ${alpha})`,
      `rgba(75, 192, 192, ${alpha})`,
      `rgba(153, 102, 255, ${alpha})`,
      `rgba(255, 159, 64, ${alpha})`,
      `rgba(199, 199, 199, ${alpha})`,
      `rgba(83, 102, 255, ${alpha})`,
      `rgba(40, 159, 64, ${alpha})`,
      `rgba(210, 199, 199, ${alpha})`,
    ];
    return colors[index % colors.length];
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Patient Insights</h1>
      
      <Tabs defaultValue="timeline" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="timeline">Symptom Timeline</TabsTrigger>
          <TabsTrigger value="frequency">Symptom Frequency</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Symptom Timeline</CardTitle>
              <CardDescription>Track how symptoms have changed over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <Line 
                data={timelineChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Severity'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Date'
                      }
                    }
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="frequency">
          <Card>
            <CardHeader>
              <CardTitle>Symptom Frequency</CardTitle>
              <CardDescription>How often each symptom occurs</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <Bar 
                data={frequencyChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Frequency'
                      }
                    }
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>Topics Distribution</CardTitle>
              <CardDescription>Distribution of discussion topics</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex justify-center">
              <div className="w-3/4 h-full">
                <Pie 
                  data={topicChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Insights;
