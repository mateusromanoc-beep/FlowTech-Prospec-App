interface ProspectingParams {
  zip: string;
  subcat: string;
  city: string;
}

export async function triggerProspecting(params: ProspectingParams) {
  // O aplicativo utilizará a execução do workflow n8n via API
  // Workflow ID: zJRKDRpA9uph6ktx
  
  console.log("Iniciando prospecção no n8n com:", params);
  
  try {
    // Note: Em produção, isso usaria a URL do seu n8n e API Key
    // Por enquanto, vamos simular ou usar o MCP se disponível
    const response = await fetch("/api/proxy-n8n", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    
    return await response.json();
  } catch (error) {
    console.error("Erro ao disparar n8n:", error);
    throw error;
  }
}
