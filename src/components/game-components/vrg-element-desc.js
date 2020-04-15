
import { html, css } from 'lit-element';
import { VrgBase } from '../../vrg-base.js';

const typeNameConversion = {
    "base": {
        order: 1,
        name: "Bases"
    },
    "ship": {
        order: 1,
        name: "Spaceships"
    },
    "planet": {
        order: 1,
        name: "Planets"
    },
    "dirtySpace": {
        order: 1,
        name: "Dirty spaces"
    },
    "star": {
        order: 1,
        name: "Star"
    },
    "gravArrow": {
        order: 1,
        name: "Gravity Arrow"
    }
}

export class VrgElementDesc extends VrgBase {
    //we need to init values in constructor

    static get properties() {
        return {
            elements: Array,
            elementViewedId: Number,
            userId: String,
            actionId: Number,
            open: Boolean,
        }
    }

    constructor() {
        super()
        this.elements = [];
        this.open = true;
    }

    get selfStyles() {
        return css`
        .root{
            width: auto!important;
            max-width:600px;
        }
        .separator{
            background-color:grey;
            width:0.1em;
            margin:1em;
        }
        .selected{
            background-color:grey;
        }
        .action{
            color:black;
            display: flex;
            background-color: lightgrey;
            padding: 0.5em;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            margin-top:1em;
        }
        .action:hover{
            display: flex;
            background-color: grey;
            box-shadow: 0 2px 4px rgba(0,0,0,0.12), 0 2px 3px rgba(0,0,0,0.24);
        }
        .self::after{
            content:' (owner)'
        }
        .list-cat{
            width:200px;
        }
        
        .hide{
            display:none;
        }`
    }

    displayElementDesc() {
        if (this.elements && this.elementViewedId) {
            let elem = this.elements.find(elem=>elem.id===this.elementViewedId);
            if(!elem){
                this.elementViewedId = undefined;
                return ''
            }
            return html`<h4>
                            <span style="width:100%" class="${elem.overtip ? 'has-overtip' : ''}">${elem.name}${elem.overtip ? html`<div class='overtip'>${elem.overtip}</div>` : ''}</span>
                        </h4>
                        <div>
                            <p>${elem.desc}</p>
                            ${elem.fuel !== undefined ? html`<div class="has-overtip">fuel : ${elem.fuel}/${elem.fuelMax} <div class="overtip">When there is no fuel left, you can't burn anymore. Land on a planet to refuel.</div></div>` : ``}
                            ${elem.damage ? html`<div class="has-overtip">damage : ${elem.damage} <div class="overtip">crew is repairing and ship can't burn for this number of round</div></div>` : ``}
                            ${this.drawActions(elem)}
                            ${this.drawPlannedActions(elem)}
                        </div>`
        }
        return '';
    }

    drawActions(selectedElement) {
        if (selectedElement.actions && selectedElement.owner == this.userId) {
            return html`<div class="flex-box f-vertical f-j-space">
                            <span>Actions : </span>
                            ${selectedElement.actions.map(action => html`<div 
                                                                    class="action flex-box f-horizontal f-j-space" 
                                                                    @click="${() => this.emit('select-action', {
                action,
                element: selectedElement
            })}">
                                                                        ${action.name}${this.selectedActionId == action.id ?
                    html`<span 
                                                                                    @click="${e => {
                            e.stopPropagation();
                            this.selectedAction = undefined;
                            this.mapRenderer.cancelAction()
                        }}">X</span>` :
                    ``}
                                                                </div>`)}
                        </div>`
        } else {
            return html``
        }
    }

    displayElementList() {
        if (this.elements) {
            if(this.elements.length === 1){
                this.elementViewedId = this.elements[0].id;
            }
            let elementWithCatTitle = {};
            for (let element of this.elements) {
                if (!elementWithCatTitle[element.type]) {
                    let typeDesc = typeNameConversion[element.type];
                    if (!typeDesc) {
                        console.error("element-desc : type desc missing for ", element.type);
                        typeDesc = {
                            order: 99,
                            name: element.type
                        }
                    }
                    elementWithCatTitle[element.type] = { ...typeDesc, list: [element] };
                } else {
                    elementWithCatTitle[element.type].list.push(element)
                }
            }
            let sortedCat = Object.values(elementWithCatTitle).sort((a, b) => a.order - b.order);
            return sortedCat.map(cat => 
                html`<div class="list-cat">
                    <h5>${cat.name}</h5>
                    <ul>
                        ${cat.list.map(element=>html`<li @click="${e=>this.elementViewedId=element.id}" class="list-element ${element.owner == this.userId ? 'self' : ''} ${element.id == this.elementViewedId ? 'selected' : ''}">${element.name}</li>`)}
                    </ul>
                </div>`)
        } else {
            return html``;
        }
    }

    drawPlannedActions(selectedElement) {
        if (selectedElement.plannedActions && selectedElement.owner == this.userId) {
            return html`<div class="flex-box f-vertical f-j-space"><span>Planned actions : </span>
            ${selectedElement.plannedActions.map(action => html`<div class="action flex-box f-horizontal f-j-space">
                                            ${action.name}<span @click="${e => { this.emit('cancel-action', action) }}">X</span>
                                        </div>`)}
            </div>`
        } else {
            return html``
        }
    }

    render() {
        return html`
        ${this.styles}
        <div class="card flex-box f-vertical f-j-space root" ?hidden="${!this.elements || this.elements.length === 0}">
            <div>
                <span class="ml-1" style="float: right;" @click="${e => this.open = !this.open}">${this.open ? '▼' : '▲'}</span>
                Element on this hex
            </div>
            <div ?hidden="${!this.open}" class="flex-box f-horizontal f-j-space">
                <div class="flex-box f-vertical f-j-space">
                    ${ this.displayElementList() }
                </div>
                <div class="separator" ?hidden="${!this.elementViewedId}"></div>
                <div class="flex-box f-vertical f-j-space">
                    ${ this.displayElementDesc() }
                </div>
            </div>
        </div > `
    }
}
customElements.define('vrg-element-desc', VrgElementDesc); 
