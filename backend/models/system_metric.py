"""
System Metrics Model - Tracks system performance for health dashboard (Optional)
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime


class SystemMetric(Base):
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    metric_type = Column(String(50), nullable=False)  # e.g., RECOGNITION_LATENCY, ERROR_RATE
    value = Column(Float, nullable=False)
    unit = Column(String(20))                         # e.g., "ms", "percent", "count"
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    device = relationship("Device", backref="system_metrics")
    
    def __repr__(self):
        return f"<SystemMetric(id={self.id}, type='{self.metric_type}', value={self.value})>"


# Common metric types
class MetricTypes:
    # Recognition performance
    RECOGNITION_LATENCY = "RECOGNITION_LATENCY"      # Time to process face (ms)
    RECOGNITION_SUCCESS = "RECOGNITION_SUCCESS"      # Successful recognitions
    RECOGNITION_FAILURE = "RECOGNITION_FAILURE"      # Failed recognitions
    RECOGNITION_ACCURACY = "RECOGNITION_ACCURACY"    # Success rate (%)
    
    # System health
    UPTIME = "UPTIME"                                # Device uptime (seconds)
    CPU_USAGE = "CPU_USAGE"                          # CPU usage (%)
    MEMORY_USAGE = "MEMORY_USAGE"                    # Memory usage (%)
    DISK_USAGE = "DISK_USAGE"                        # Disk usage (%)
    
    # Network
    NETWORK_LATENCY = "NETWORK_LATENCY"              # API response time (ms)
    SYNC_SUCCESS = "SYNC_SUCCESS"                    # Successful syncs
    SYNC_FAILURE = "SYNC_FAILURE"                    # Failed syncs
    
    # Gesture detection
    GESTURE_LATENCY = "GESTURE_LATENCY"              # Gesture detection time (ms)
    GESTURE_SUCCESS = "GESTURE_SUCCESS"              # Successful gesture detections
    GESTURE_FAILURE = "GESTURE_FAILURE"              # Failed gesture detections
