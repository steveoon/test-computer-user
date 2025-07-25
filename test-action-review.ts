// Test file for GitHub Action review
// This file contains various code patterns to test the review capabilities

interface User {
  name: string;
  email: string;
  age: number;
}

// Function with potential issues
function processUserData(users: any[]) {
  const results = [];
  
  // Using for-in loop (not recommended for arrays)
  for (let i in users) {
    const user = users[i];
    
    // No null checking
    console.log(user.name.toUpperCase());
    
    // Magic number
    if (user.age > 18) {
      results.push(user);
    }
  }
  
  return results;
}

// Async function without error handling
async function fetchData(url: string) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Function with unused variables
function calculateTotal(items: any[]) {
  let total = 0;
  let count = 0;
  let average = 0; // unused variable
  
  items.forEach((item) => {
    total += item.price;
    count++;
  });
  
  return total;
}

// Complex nested conditions
function validateUser(user: any) {
  if (user) {
    if (user.name) {
      if (user.email) {
        if (user.age) {
          if (user.age >= 18) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}

// Export for testing
export { processUserData, fetchData, calculateTotal, validateUser };