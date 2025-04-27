'use client';
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Insights = () => {
  const [topicData, setTopicData] = useState([]);
  const [symptomData, setSymptomData] = useState([]);
  const [knowledgeGapData, setKnowledgeGapData] = useState([]);
  const [ragPerformance, setRagPerformance] = useState({ by_source: [], over_time: [] });
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Fetch data from your API endpoints
    const fetchData = async () => {
      const topicsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/insights/conversation-topics`);
      const topicsData = await topicsResponse.json();
      setTopicData(topicsData.topics);
      
      const symptomsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/insights/symptoms`);
      const symptomsData = await symptomsResponse.json();
      setSymptomData(symptomsData.symptoms);
      
      const gapsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/insights/knowledge-gaps`);
      const gapsData = await gapsResponse.json();
      setKnowledgeGapData(gapsData.knowledge_gaps);
      
      const ragResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/insights/rag-performance`);
      const ragData = await ragResponse.json();
      setRagPerformance(ragData);
    };
    
    fetchData();
  }, []);
  
  if (!isClient) {
    return <div className="insights-container"><h1>Loading...</h1></div>;
  }
  
  return (
    <div className="insights-container">
      <h1>Conversation Insights</h1>
      
      <div className="chart-section">
        <h2>Top Conversation Topics</h2>
        <BarChart width={600} height={300} data={topicData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="topic" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </div>
      
      <div className="chart-section">
        <h2>Common Symptoms & Problems</h2>
        <PieChart width={400} height={400}>
          <Pie
            data={symptomData}
            cx={200}
            cy={200}
            labelLine={true}
            outerRadius={150}
            fill="#8884d8"
            dataKey="count"
            nameKey="symptom"
            label={({symptom, percent}: {symptom: string, percent: number}) => `${symptom}: ${(percent * 100).toFixed(0)}%`}
          >
            {symptomData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>
      
      <div className="chart-section">
        <h2>Knowledge Gaps</h2>
        <BarChart width={600} height={300} data={knowledgeGapData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="gap" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#82ca9d" />
        </BarChart>
      </div>
      
      <div className="chart-section">
        <h2>RAG Performance Over Time</h2>
        <LineChart width={600} height={300} data={ragPerformance.over_time}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cosine_distance" stroke="#ff7300" />
        </LineChart>
      </div>
      
      <div className="chart-section">
        <h2>RAG Performance by Source</h2>
        <BarChart width={600} height={300} data={ragPerformance.by_source}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="source" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="avg_cosine_distance" fill="#8884d8" />
          <Bar dataKey="query_count" fill="#82ca9d" />
        </BarChart>
      </div>
    </div>
  );
};

export default Insights;