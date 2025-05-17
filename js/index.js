var lastClickedElement = null;
var languageImages = Array.from(document.querySelectorAll('.badge img')).map(element => {
    return {
        lang: element.parentElement.querySelector('b').innerText.replaceAll(' (Em aprendizado)', ''),
        source: element.src
    }
})

document.addEventListener('DOMContentLoaded', async () => {
    const promises = [getProjectsFromGithub(), getCustomRepositories() ];
    getCertificates().then(() => {
        document.querySelector('.certificates-loading-container').setAttribute('disabled', '');
        document.querySelector('#certificates .list li:not(.model)').click();
    }).catch(error => {
        console.error('Ocorreu um erro durante o processo de obter os certificados. ', error);
    });;
    for(const promise of promises){
        await promise.catch(error => {
            console.error('Ocorreu um erro ao se conectar com a API do GITHUB. ', error);
        });
    }
    document.querySelector('.github-loading-container').setAttribute('disabled', '');
} );
document.addEventListener('scroll', () => {
    document.documentElement.dataset.scroll = window.scrollY;
} );
document.addEventListener('touchstart', () => {
    document.documentElement.setAttribute('touch-device', '');
    document.removeEventListener('touchstart');
})

document.querySelector('#contact_btn_send').addEventListener('click', async () => {
    const contactForm = {
        name: document.querySelector('#contact_name').value,
        email: document.querySelector('#contact_email').value,
        phone: document.querySelector('#contact_phone_number').value,
        message: document.querySelector('#contact_message').value
    };

    const isValidEmail = (email) => {
        var regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }
    if(!isValidEmail(contactForm.email)){
        alert('O email informado não está com a formatação esperada. Verifique e tente novamente');
        return;
    }
    if(contactForm.name.trim().length < 4){
        alert('O campo \'Seu nome\' precisa conter pelo menos 4 caracteres. Verifique e tente novamente');
        return;
    }
    if(contactForm.phone.length != 14 && document.querySelector('.number-type-cellphone input').checked ||
        contactForm.phone.length != 12 && document.querySelector('.number-type-telephone input').checked){
        alert('O campo \'Número de Telefone/Celular\' não está no formato esperado. Verifique e tente novamente');
        return;
    }
    if(contactForm.message.trim().length === 0){
        alert('O campo \'Mensagem\' não pode ficar vazio!');
        return;
    }
    const requestContent = {
        method: 'POST',
        body: JSON.stringify(contactForm)
    };
    const response = await fetch('https://contact.kledsonzg.com.br', requestContent);
    if(response.ok){
        alert('Solicitação de contato enviado com sucesso!');
        window.location.reload();
        return;
    }

    alert('Ocorreu um erro na solicitação de contato. Tente novamente mais tarde.');
})
document.querySelector('#projects .filter-container > menu').addEventListener('click', (ev) => {
    //console.log('possivel click do menu', ev.target, lastClickedElement);
    const menuElement = document.querySelector('.filter-container > menu');
    if(Array.from(menuElement.querySelectorAll('ul li')).includes(lastClickedElement) )
        return;
    lastClickedElement = menuElement;
});
document.querySelectorAll('#projects .filter-container menu ul li').forEach((element) => {
    element.addEventListener('click', () => {
        lastClickedElement = element;

        element.classList.toggle('selected', !element.classList.contains('selected') );
        
        let parent = element.parentElement;
        if(parent.querySelectorAll('li.selected').length > 0)
            parent.parentElement.classList.toggle('filtered', true);
        else parent.parentElement.classList.toggle('filtered', false);

        const filters = Array.from(document.querySelectorAll('.filter-container menu ul li.selected') ).map(listItemElement => {
            return listItemElement.querySelector('span').innerText;
        });

        document.querySelectorAll('.project-card').forEach(cardElement => {
            if(cardElement.hasAttribute('style'))
                cardElement.removeAttribute('style');

            if(filters.length === 0)
                return;

            const cardLanguages = Array.from(cardElement.querySelectorAll('img')).map(img => {
                return img.title;
            });
            
            const success = cardLanguages.filter(filter => filters.includes(filter)).length === filters.length;
            if(!success)
                cardElement.style.display = 'none';
        });
    } );
});
document.querySelector('#projects .filter-container menu .btn-delete-filters').addEventListener('click', () => {
    const menuElement = document.querySelector('#projects .filter-container menu');
    menuElement.querySelectorAll('ul li.selected').forEach(listItemElement => {
        listItemElement.classList.toggle('selected', false);
    });
    document.querySelectorAll('.project-card').forEach(cardElement => {
        if(cardElement.hasAttribute('style'))
            cardElement.removeAttribute('style');
    });
    menuElement.classList.toggle('filtered', false);
} );
document.querySelector('.btn-open-nav').addEventListener('click', () => {
    const mobileMenuNavElement = document.querySelector('nav.page-nav');
    mobileMenuNavElement.classList.toggle('active', !mobileMenuNavElement.classList.contains('active') );
});
document.body.addEventListener('click', () => {
    toggleProjectFiltersListVisibility();
})

function toggleProjectFiltersListVisibility(){
    const menuElement = document.querySelector('#projects .filter-container menu');
    const menuListElement = menuElement.querySelector('ul');
    const validElementsToHandle = [menuElement].concat(Array.from(menuListElement.querySelectorAll('li') ) )
    
    if(validElementsToHandle.includes(lastClickedElement) ){
        if(lastClickedElement === menuElement){
            const isMenuVisible = menuListElement.classList.contains('visible-flex');
            menuListElement.classList.toggle('visible-flex', !isMenuVisible);
        }
        lastClickedElement = null;
        return;
    }
    menuListElement.classList.toggle('visible-flex', false);
    lastClickedElement = null;
}

function getDateString(date){
    const day = `${date.getDate() < 10 ? '0' : ''}${date.getDate()}`,
    month = `${date.getMonth() + 1 < 10 ? '0' : ''}${date.getMonth() + 1}`,
    year = date.getFullYear(),
    hours = `${date.getHours() < 10 ? '0' : ''}${date.getHours()}`,
    minutes = `${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}`,
    seconds = `${date.getSeconds() < 10 ? '0' : ''}${date.getSeconds()}`;
    return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
}

function deleteProjectCards(){
    Array.from(document.querySelector('.projects-container').children).forEach(element => {
        if(element.classList.contains('model') )
            return;
        element.remove();
    })
}

async function getCustomRepositories(){
    await fetch('/custom/private_repositories.json').then(async (response) => {
        const privateRepositories = await response.json().catch(error => {
            console.error('Erro ao obter os repositórios/projetos privados.', error);
        });

        setProjectInformations(privateRepositories, null, true);
    }); 
}

async function getRepositoriesFromStorage() {
    let save = localStorage.getItem('kledsonzg-repositories');
    if(!save){
        console.error('Erro ao obter os repositórios salvos localmente.');
        return;
    }

    save = JSON.parse(save);
    setProjectInformations(save.repositories, null, true);
    
    const lastUpdate = ' ' + getDateString(new Date(save.time * 1000) );
    const span = document.querySelector('#projects .last-update-container span');
    span.innerText = span.innerText + lastUpdate + ' (cache)';
    span.parentElement.setAttribute('enabled', '');

    deleteProjectCards();
    return;
}

async function getProjectsFromGithub() {
    const githubAccess = {
        headers:{
            'X-GitHub-Api-Version': '2022-11-28'
        },
        myRepositoriesUrl: 'https://api.github.com/users/kledsonzg/repos'
    }

    await fetch(githubAccess.myRepositoriesUrl, {method: 'get', headers: githubAccess.headers} ).then(async (response) => {
        if(!response.ok){
            getRepositoriesFromStorage();
            return;
        }
        await response.json().then(async (data) => {
            const repositories = data.filter(filter => filter.topics.includes('view-from-my-portfolio') && !filter.fork);
            const isOk = await setProjectInformations(repositories, githubAccess, false);
            if(isOk){
                const save = {
                    time: Math.floor(Date.now() / 1000),
                    repositories: repositories
                }
                localStorage.setItem('kledsonzg-repositories', JSON.stringify(save) );
                
                const lastUpdate = ' ' + getDateString(new Date(save.time * 1000) );
                const span = document.querySelector('#projects .last-update-container span');
                span.innerText = span.innerText + lastUpdate;
                span.parentElement.setAttribute('enabled', '');
                return;
            }
            
        } );
    } ).catch( async () => {
        await getRepositoriesFromStorage();
    }) ;
}

async function getCertificates() {
    const container = document.querySelector('.main-certificates-container .list .wrapper');
    const model = container.querySelector('.model');
    const response = await fetch('/custom/certificados.json').catch(error => {
        console.error('Houve um erro na requisição de certificados.', error);
    });
    document.querySelector('.certificate-visualizer').onclick = () => {
        document.querySelector('.open-credential').click();
    }
    const buttonToOpenCredentialInNewTable = document.querySelector('.open-credential');
    buttonToOpenCredentialInNewTable.onclick = (ev) => {
        if(buttonToOpenCredentialInNewTable.href){
            const isInvalidHref = buttonToOpenCredentialInNewTable.href.length === 0 && buttonToOpenCredentialInNewTable.hasAttribute('href');
            if(!isInvalidHref)
                return;
            buttonToOpenCredentialInNewTable.removeAttribute('href');
            ev.preventDefault();
        }
    }

    await response.json().then(async certificates => {
        const maxCertificateNameLength = 25;
        certificates.sort((a, b) => {
            const emissionDates = [a.emissionDate, b.emissionDate];
            const dates = [new Date(parseInt(emissionDates[0].substring(7)), 
                parseInt(emissionDates[0].substring(3, 5)) - 1, parseInt(emissionDates[0].substring(0, 2))),
                new Date(parseInt(emissionDates[1].substring(7)), 
                parseInt(emissionDates[1].substring(3, 5)) - 1, parseInt(emissionDates[1].substring(0, 2)))];

                return dates[0] > dates[1] ? -1 : dates[1] > dates[0] ? 1 : 0;
        })
        for(const certificate of certificates){
            const id = certificate.id,
            company = certificate.company,
            emissionDate = certificate.emissionDate,
            learningTime = certificate.learningTime;
            const credentialUrl = certificate.credential.replace('{id}', id),
            imagePath = certificate.imagePath.replace('{id}', id);

            let name = certificate.name;
            const nameLength = name.length;
            name = nameLength > maxCertificateNameLength ? name.substring(0, maxCertificateNameLength - 3) + '...' : name;

            const clone = model.cloneNode(true);
            clone.className = '';

            clone.querySelector('b.company').innerText = company;
            clone.querySelector('span.li-emission-date').innerText = emissionDate;
            clone.querySelector('span.name').innerText = name;
            clone.title = certificate.name;

            await fetch(imagePath).then(async image => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if(reader.error){
                        console.error('Houve um erro ao carregar a imagem ' + `${imagePath}.`, reader.error);
                        return;
                    }

                    clone.querySelector('img').src = reader.result;
                }
                reader.readAsDataURL(await image.blob());
            });

            clone.onclick = () => {
                container.querySelectorAll('li:not(.model)').forEach(listItemElement => listItemElement.className = '');
                clone.className = 'selected';
                setCertificateVisualizerInformations(id, company, certificate.name, emissionDate,
                    learningTime, credentialUrl, clone.querySelector('img').src);
            }

            container.appendChild(clone);
        }
    });
}

function setCertificateVisualizerInformations(id, company, name, emissionDate, learningTime, credentialUrl, imageUrl){
    const tableElement = document.querySelector('.certificate-info');
    const cellElements = Array.from(tableElement.querySelectorAll('td'));
    const buttonToOpenCredentialInNewTable = document.querySelector('.open-credential');
    const certificateVisualizer = document.querySelector('.certificate-visualizer');

    if(credentialUrl)
        buttonToOpenCredentialInNewTable.href = credentialUrl;
    else buttonToOpenCredentialInNewTable.disabled = true;

    certificateVisualizer.src = imageUrl;

    cellElements[0].innerText = id;
    cellElements[1].innerText = company;
    cellElements[2].innerText = name;
    cellElements[3].innerText = emissionDate;
    cellElements[4].innerText = learningTime;
}

async function setProjectInformations(repositories, githubAccess, isFromLocalStorage) {
    const card = document.querySelector('.project-card');
    const container = card.parentElement;

    for(const repository of repositories){
        console.log(repository);
        const name = repository.name;
        const url = repository.html_url;
        const descriptionArray = repository.description === null ? [] : repository.description.split(' ');
        const applicationUrl = repository.homepage;
        const spoilerImagesUrl = repository.contents_url.replace('{+path}', 'spoilers');

        const cardClone = card.cloneNode(true);
        cardClone.classList.toggle('model', false);
        cardClone.classList.toggle('hidden', false);

        cardClone.querySelectorAll('.project-name').forEach(element => {
            element.innerText = name.replaceAll('-', ' ');
        });

        const repositoryElement = cardClone.querySelector('.option.repository') ;
        if(url){
            repositoryElement.href = url;
            repositoryElement.target = '_blank';
        } else repositoryElement.setAttribute('disabled', '');

        const webApplicationElement = cardClone.querySelector('.option.webapp');
        if(applicationUrl){
            webApplicationElement.href = applicationUrl;
            webApplicationElement.target = '_blank';
        }
        else webApplicationElement.setAttribute('disabled', '');

        const descriptionElement = cardClone.querySelector('.card-description .description');
        descriptionElement.innerHTML = '';
        if(descriptionArray.length === 0)
            descriptionElement.setAttribute('disabled', '');
        else descriptionArray.forEach(content => {
            const span = document.createElement('span');
            span.innerText = content;
            span.innerHTML += '&nbsp;';
            descriptionElement.appendChild(span);
        });

        if(isFromLocalStorage){
            // CARREGAR AS IMAGENS DAS LINGUAGENS COM BASE NAS INFORMAÇÕES SALVAS LOCALMENTE.
            const langElements = Array.from(cardClone.querySelectorAll('.languages, .card-footer') );
            repository.languages.forEach(language => {
                langElements.forEach(element => {
                    const result = languageImages.find(filter => filter.lang === language);
                    if(!result){
                        console.error('Falha ao obter imagem da linguagem:', language);
                        return;
                    }
                    const img = document.createElement('img');
                    img.src = result.source;
                    element.appendChild(img);
                })
            });

            // SETAR A IMAGEM PRINCIPAL E SETAR O ATRIBUTO COM TODAS AS IMAGENS.
            await fetch(repository.imagesJsonUrl).then(async response => {
                if(!response.ok){
                    console.error(await response.text());
                    cardClone.querySelector('.option.pictures').setAttribute('disabled', '');
                    return;
                }
                const imagesJson = await response.json();
                cardClone.setAttribute('images', JSON.stringify(imagesJson) );
                cardClone.querySelector('img').src = imagesJson[0];
            }).catch((error) => {
                console.error(error);
            });
        }
        else{
            if(!(await setProjectLanguage(cardClone, repository, githubAccess.headers)) ){
                return false;
            }
            if(!(await setProjectSpoilerImages(spoilerImagesUrl, cardClone, repository, githubAccess.headers)) ){
                return false;
            }
        }
        
        try{
            cardClone.querySelector('.option.pictures').onclick = () => {
                const images = JSON.parse(cardClone.getAttribute('images') );
                openImageViewer(images);
            }
        }
        catch{}

        if(location.origin === applicationUrl){
            const cards = Array.from(container.children);
            cards.unshift(cardClone);
            cards.forEach(card => container.appendChild(card) );
            continue;
        }

        container.appendChild(cardClone);
    }
    card.classList.toggle('hidden', true);
    return true;
}

async function setProjectLanguage(projectElement, repository, requestHeaders){
    let isOk = false;
    await fetch(repository.languages_url, {method: 'get', headers: requestHeaders } ).then(async (response) => {
        if(!response.ok){
            console.error(await response.text());
            return;
        }
        
        await response.json().then((_data) => {             
            const languages = Object.keys(_data).map(key => key.toUpperCase() );
            repository.languages = languages;
            const langElements = Array.from(projectElement.querySelectorAll('.languages, .card-footer') );
            languages.forEach(language => {
                langElements.forEach(element => {
                    const result = languageImages.find(filter => filter.lang === language);
                    if(!result){
                        console.error('Falha ao obter imagem da linguagem:', language);
                        return;
                    }
                    const img = document.createElement('img');
                    img.src = result.source;
                    img.title = result.lang;
                    element.appendChild(img);
                })
            })
            isOk = true;
        } );
    } ).catch((error) => {
        console.error(error);
    });
    return isOk;
}

async function setProjectSpoilerImages(jsonUrl, projectElement, repository, requestHeaders) {
    let isOk = false;
    await fetch(jsonUrl, {method: 'get', headers: requestHeaders} ).then(async response => {
        // FUNÇÃO PARA SETAR A IMAGEM PRINCIPAL E SETAR O ATRIBUTO COM TODAS AS IMAGENS.
        let setProjectImages = async (projectElement, imagesJsonUrl) => {
            await fetch(imagesJsonUrl).then(async _response => {
                if(!_response.ok){
                    console.error(await _response.text());
                    return;
                }
                let imagesJson = await _response.json();
                projectElement.setAttribute('images', JSON.stringify(imagesJson) );
                projectElement.querySelector('img').src = imagesJson[0];
                isOk = true;
            }).catch((error) => {
                console.error(error);
            })
        }

        if(!response.ok){
            isOk = response.status === 404;
            projectElement.querySelector('.option.pictures').setAttribute('disabled', '');
            return;
        }
        try{
            const imagesJsonUrl = (await response.json())[0].download_url;
            repository.imagesJsonUrl = imagesJsonUrl;
            await setProjectImages(projectElement, imagesJsonUrl);
        }catch{}
    }).catch((error) => {
        console.log(error);
    });
    return isOk;
}

function nextPreviousImageViewerAction(isNext){
    const scroller = document.querySelector('.image-viewer-container .image-scroller');
    const images = Array.from(scroller.querySelectorAll('img') );
    let index = images.findIndex(element => element.classList.contains('selected') );
    if(index === -1 && images.length > 0){
        images[0].classList.toggle('selected', true);
        return;
    }

    index = isNext && index === images.length - 1 ? 0 : !isNext && index === 0 ? images.length - 1 : isNext ? index + 1 : index - 1;
    images[index].click();
}

function setImageSourceAsBase64String(element, url, clickOnLoad) {
    const xhttp = new XMLHttpRequest();
    xhttp.onloadend = () => {
        const blob = xhttp.response;
        const reader = new FileReader();
        reader.onload = () => {
            if(reader.error){
                element.src = 'error';
                return;
            }
            element.src = reader.result;
            if(clickOnLoad)
                element.click();
        }
        reader.readAsDataURL(blob);
    }
    xhttp.open('get', url);
    xhttp.responseType = 'blob';
    xhttp.send();
}

function openImageViewer(images) {
    const container = document.querySelector('.image-viewer-container');
    const scroller = container.querySelector('.image-scroller');
    const mainImageViewer = container.querySelector('.centerered-image-container img');

    scroller.querySelectorAll('img').forEach(img => img.remove() );

    images.forEach(img => {
        const element = document.createElement('img');
        setImageSourceAsBase64String(element, img, images.indexOf(img) === 0);
        element.onclick = () => {
            scroller.querySelectorAll('.selected').forEach(selected => selected.classList.toggle('selected', false) );
            mainImageViewer.src = element.src;
            element.classList.toggle('selected', true);
        }
        scroller.appendChild(element);
    } );

    container.classList.toggle('enabled', true);
    scroller.querySelector('img').click();
}

function setProjectCardInfoVisible(cardElement){
    const moreOptionsContainer = cardElement.querySelector('.more-options');
    if(!moreOptionsContainer)
        return;
    document.querySelectorAll('.project-card:not(.model)').forEach(element => element.classList.toggle('selected', false) );
    cardElement.classList.toggle('selected', true);
}