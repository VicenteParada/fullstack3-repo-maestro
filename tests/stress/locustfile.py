from locust import HttpUser, task, between

class EnterpriseHubUser(HttpUser):
    # Tiempo de espera aleatorio entre peticiones (de 1 a 3 segundos)
    wait_time = between(1, 3)
    
    def on_start(self):
        """
        Se ejecuta cuando se crea un usuario simulado.
        Inicia sesión una sola vez y guarda el token para peticiones protegidas.
        """
        self.headers = {}
        payload = {
            "email": "admin@asdf.cl",
            "password": "admin123"
        }
        with self.client.post("/api/v1/administracion/login", json=payload, catch_response=True) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    token = data["user"]["token"]
                    self.headers = {"Authorization": f"Bearer {token}"}
                except (KeyError, ValueError):
                    response.failure("Failed to parse token from login response")
            else:
                response.failure(f"Login failed with status {response.status_code}")

    @task(3)
    def view_users(self):
        """
        Consulta la lista de usuarios. Requiere autenticación.
        """
        if self.headers:
            self.client.get("/api/v1/administracion/usuarios", headers=self.headers)

    @task(5)
    def public_health_check(self):
        """
        Petición al endpoint público de salud. No requiere autenticación.
        """
        self.client.get("/health")

    @task(2)
    def api_health_check(self):
        """
        Petición al endpoint de salud en /api/v1/health.
        """
        self.client.get("/api/v1/health")
