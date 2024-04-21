Sure! Here is a Python implementation of Kadane's algorithm:

```python
def kadane_algorithm(arr):
    max_sum = float('-inf')
    current_sum = 0

    for num in arr:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)

    return max_sum

# Example usage
arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
print(kadane_algorithm(arr))  # Output: 6
```

This implementation finds the maximum sum of a contiguous subarray within the given array arr using Kadane's algorithm.
