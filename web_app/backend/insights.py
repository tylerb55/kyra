from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
import pandas as pd
from collections import Counter
import json
import traceback
import logging
from config import supabase_client
import re

# Create a router instance
router = APIRouter(
    prefix="/insights",
    tags=["insights"],
    responses={404: {"description": "Not found"}},
)

def extract_json_from_markdown(markdown_text):
    """Extract JSON content from markdown code blocks"""
    pattern = r'```json\s*([\s\S]*?)\s*```'
    match = re.search(pattern, markdown_text)
    if match:
        json_str = match.group(1)
        return json_str
    else:
        return None

@router.get("/conversation-topics")
async def get_conversation_topics(username: str = None, limit: int = 10):
    """Get most common topics across all conversations"""
    try:
        query = supabase_client.table("conversation_transcripts").select("topics")
        
        if username:
            query = query.eq("username", username)
        
        result = query.execute()
        
        # Extract all topics from all conversations
        all_topics = []
        for row in result.data:
            if row.get("topics"):
                all_topics.extend(row["topics"])
        
        # Count frequency of each topic
        topic_counts = Counter(all_topics)
        
        # Return top N topics
        top_topics = [{"topic": topic, "count": count} 
                     for topic, count in topic_counts.most_common(limit)]
        
        return {"topics": top_topics}
    except Exception as e:
        logging.error(f"Error getting conversation topics: {str(e)} \n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting conversation topics: {str(e)}"
        )

@router.get("/symptoms")
async def get_common_symptoms(username: str = None, limit: int = 10):
    """Get most common symptoms/problems mentioned"""
    try:
        query = supabase_client.table("conversation_transcripts").select("symptoms_problems")
        
        if username:
            query = query.eq("username", username)
        
        result = query.execute()
        
        # Extract all symptoms from all conversations
        all_symptoms = []
        for row in result.data:
            if row.get("symptoms_problems"):
                all_symptoms.extend(row["symptoms_problems"])
        
        # Count frequency of each symptom
        symptom_counts = Counter(all_symptoms)
        
        # Return top N symptoms
        top_symptoms = [{"symptom": symptom, "count": count} 
                       for symptom, count in symptom_counts.most_common(limit)]
        
        return {"symptoms": top_symptoms}
    except Exception as e:
        logging.error(f"Error getting common symptoms: {str(e)} \n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting common symptoms: {str(e)}"
        )

@router.get("/knowledge-gaps")
async def get_knowledge_gaps(username: str = None, limit: int = 10):
    """Get most common knowledge gaps"""
    try:
        query = supabase_client.table("conversation_transcripts").select("knowledge_gaps")
        
        if username:
            query = query.eq("username", username)
        
        result = query.execute()
        
        # Extract all knowledge gaps from all conversations
        all_gaps = []
        for row in result.data:
            if row.get("knowledge_gaps"):
                all_gaps.extend(row["knowledge_gaps"])
        
        # Count frequency of each gap
        gap_counts = Counter(all_gaps)
        
        # Return top N gaps
        top_gaps = [{"gap": gap, "count": count} 
                   for gap, count in gap_counts.most_common(limit)]
        
        return {"knowledge_gaps": top_gaps}
    except Exception as e:
        logging.error(f"Error getting knowledge gaps: {str(e)} \n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting knowledge gaps: {str(e)}"
        )

@router.get("/rag-performance")
async def get_rag_performance(username: str = None, days: int = 30):
    """Get RAG performance metrics over time"""
    try:
        query = supabase_client.table("rag_metrics").select("*")
        
        if username:
            query = query.eq("user_id", username)
        
        # Limit to recent data
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        query = query.gte("timestamp", cutoff_date)
        
        result = query.execute()
        
        # Convert to pandas DataFrame for easier analysis
        df = pd.DataFrame(result.data)
        
        if df.empty:
            return {
                "by_source": [],
                "over_time": []
            }
        
        # Calculate average cosine distance by source
        source_performance = df.groupby("source")["cosine_distance"].agg(
            ["mean", "count"]
        ).reset_index()
        
        source_performance = source_performance.rename(
            columns={"mean": "avg_cosine_distance", "count": "query_count"}
        )
        
        # Calculate average cosine distance over time (by day)
        if "timestamp" in df.columns:
            df["date"] = pd.to_datetime(df["timestamp"]).dt.date
            time_performance = df.groupby("date")["cosine_distance"].mean().reset_index()
            time_performance["date"] = time_performance["date"].astype(str)
            time_data = time_performance.to_dict(orient="records")
        else:
            time_data = []
        
        return {
            "by_source": source_performance.to_dict(orient="records"),
            "over_time": time_data
        }
    except Exception as e:
        logging.error(f"Error getting RAG performance: {str(e)} \n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting RAG performance: {str(e)}"
        )

@router.get("/trends")
async def get_topic_trends(days: int = 90):
    """Get trends of topics over time"""
    try:
        # Get conversations from the last N days
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        result = supabase_client.table("conversation_transcripts")\
            .select("topics, created_at")\
            .gte("created_at", cutoff_date)\
            .execute()
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(result.data)
        
        if df.empty:
            return {"trends": [], "topics": []}
        
        # Extract topics and dates
        topic_dates = []
        for row in df.itertuples():
            if not hasattr(row, 'created_at'):
                continue
                
            date = pd.to_datetime(row.created_at).strftime("%Y-%m-%d")
            if hasattr(row, 'topics') and row.topics:
                for topic in row.topics:
                    topic_dates.append({"date": date, "topic": topic})
        
        # Convert to DataFrame for analysis
        topic_df = pd.DataFrame(topic_dates)
        
        if topic_df.empty:
            return {"trends": [], "topics": []}
        
        # Count topics by date
        topic_counts = topic_df.groupby(['date', 'topic']).size().reset_index(name='count')
        
        # Get top 5 topics overall
        top_topics = topic_df['topic'].value_counts().nlargest(5).index.tolist()
        
        # Filter for just those top topics
        trend_data = topic_counts[topic_counts['topic'].isin(top_topics)]
        
        # Pivot to get topics as columns
        pivot_df = trend_data.pivot(index='date', columns='topic', values='count').fillna(0)
        
        # Convert to format suitable for charts
        result = []
        for date, row in pivot_df.iterrows():
            data_point = {"date": date}
            for topic in pivot_df.columns:
                data_point[topic] = row[topic]
            result.append(data_point)
        
        return {"trends": result, "topics": top_topics}
    except Exception as e:
        logging.error(f"Error getting topic trends: {str(e)} \n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting topic trends: {str(e)}"
        )