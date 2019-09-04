function rainbow(n, maxLength) {
  n = n * 240 / maxLength;
  return 'hsl(' + n + ',100%,50%)';
}

function perc2color(perc, min, max) {
  let base = (max - min);

  if (base == 0) { perc = 100; }
  else {
      perc = (perc - min) / base * 100;
  }
  let r, g, b = 0;
  if (perc < 50) {
      r = 255;
      g = Math.round(5.1 * perc);
  }
  else {
      g = 255;
      r = Math.round(510 - 5.10 * perc);
  }
  let h = r * 0x10000 + g * 0x100 + b * 0x1;
  return '#' + ('000000' + h.toString(16)).slice(-6);
}

function uniq(arr) {
  var seen = {}
  return arr.filter(function(item) {
      return seen.hasOwnProperty(item) ? false : (seen[item] = true)
  })
}

function mode(arr) {
  return arr.sort((a,b) =>
        arr.filter(v => v===a).length
      - arr.filter(v => v===b).length
  ).pop()
}

/*
  * Return the number of occurences of an element in an array
  * Optionally, it can be returned sorted in descending order
  * And also be limited to a number of elements
  */
function countElements(arr, sortByOccurences = true, limit = undefined) {
  let a = [], b = [], prev
  
  arr.sort();
  for ( let i = 0; i < arr.length; i++ ) {
      if ( arr[i] !== prev ) {
          a.push(arr[i])
          b.push(1)
      } else {
          b[b.length-1]++;
      }
      prev = arr[i]
  }
  
  let result = a.map((e, i) => { return { element: e, occurences: b[i] }})
  
  if (sortByOccurences) {
    result.sort((a, b) => {
      return ((a.occurences > b.occurences) ? -1 : ((a.occurences == b.occurences) ? 0 : 1))
    })
    // I don't see any point in taking limit of unsorted elements
    if (limit !== undefined) {
      result = result.slice(0, limit)
    }
  }
  return result
}

module.exports = {
  rainbow,
  perc2color,
  uniq,
  mode,
  countElements
}