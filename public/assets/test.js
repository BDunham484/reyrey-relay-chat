// fetch (apiURL)
//     .then(function (response) {
//         if (!response.ok) {
//             throw response.json()
//         }

//         return response.json();
//     })
//     .then(function (data) {
//         let helmet = {
//             name: data[0].name,
//             name: data[1].name,
//             name: data[2].name,
//             name: data[3].name,
//             name: data[4].name,
//         }

//         const res = await fetch('/api/thisIsTheRoute', {
//             method: 'POST',
//             body: JSON.stringify(helmet),
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });

//         const data = await res.json()
//     })

    const getDemHelmets = async () => {
        const response = await fetch(apiURL);
        const helmetData = await response.json()

        const helmets = {
            name: helmetData[0].name,
            name: helmetData[1].name,
            name: helmetData[2].name,
            name: helmetData[3].name,
            name: helmetData[4].name,
        }

        const res = await fetch('/api/thisIsTheRoute', {
            method: 'POST',
            body: JSON.stringify(helmets),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await res.json()
        console.log(data);
    }