# Frame
**Get all frame**
----
  Returns json data about all frames.

* **URL**

  /api/frames

* **Method:**

  `GET`
  
*  **URL Params**

    None

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />

  OR

  * **Code:** 401 UNAUTHORIZED <br />

* **Sample Call:**
  
  Javascript
  ```javascript
  fetch(`localhost:8080/api/frames`).then(r => r.json())
  ```
  Python
  ```python
  import requests
  requests.get('localhost:8080/api/frames')
  ```

**Get a frame by id**
----
  Returns json data about a single frame.

* **URL**

  /api/frames/:id

* **Method:**

  `GET`
  
*  **URL Params**

   **Required:**
 
   `id=[integer]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />

  OR

  * **Code:** 401 UNAUTHORIZED <br />

* **Sample Call:**

  Javascript
  ```javascript
  fetch(`localhost:8080/api/frames/12345678`).then(r => r.json())
  ```
  Python
  ```python
  import requests
  requests.get('localhost:8080/api/frames/12345678')
  ```

**Create a frame**
----
  Create a frame.

* **URL**

  /api/frames

* **Method:**

  `POST`
  
*  **URL Params**

  None

* **Data Params**

  `imageUrl=[string]`

  `predictions=[integer]`

* **Success Response:**

  * **Code:** 200 <br />
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />

  OR

  * **Code:** 401 UNAUTHORIZED <br />

* **Sample Call:**

  Javascript
  ```javascript
  fetch(`localhost:8080/api/frames`, {
      method: 'POST',
      cache: 'no-cache',
      body: formData // Where formData is a FormData with a file
    }).then(response => response.json())
  ```

**Updata a frame by id**
----
  Update a single frame.

* **URL**

  /api/frames/:id

* **Method:**

  `PUT`
  
*  **URL Params**

   **Required:**
 
   `id=[integer]`

* **Data Params**

  `imageUrl=[string]`

  `predictions=[integer]`

* **Success Response:**

  * **Code:** 200 <br />
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />

  OR

  * **Code:** 401 UNAUTHORIZED <br />

* **Sample Call:**

  Javascript
  ```javascript
  ```


# Prediction
# Object
# Class