import mediapipe as mp
import sys
import os

print(f"Python executable: {sys.executable}")
print(f"MediaPipe version: {getattr(mp, '__version__', 'unknown')}")
print(f"MediaPipe file: {getattr(mp, '__file__', 'unknown')}")
print(f"Has solutions? {'solutions' in dir(mp)}")
print(f"Dir(mp): {dir(mp)[:20]}...")

try:
    print(f"mp.solutions: {mp.solutions}")
except AttributeError as e:
    print(f"Error accessing mp.solutions: {e}")
