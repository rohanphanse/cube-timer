function createGraph(id, data) {
    const canvas = document.getElementById(id)
    const ctx = canvas.getContext("2d")
    const chart_data = {
        datasets: [{
            label: "Times",
            data,
            backgroundColor: "rgb(255, 99, 132)",
        }]
    }
    return new Chart(ctx, {
        type: "line",
        data: chart_data,
        options: {
            scales: {
                x: {
                    type: "linear",
                    position: "bottom"
                }
            }
        }
    })
}