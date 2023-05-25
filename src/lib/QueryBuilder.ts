import {QueryFilter} from "./QueryFilter";
import {QueryOrder, QueryOrderDirection} from "./QueryOrder";

export interface QueryBuilderConfig {
    rowsPerPage?: number
}

export class QueryBuilder {
    private _aExpand: string[] = []
    private _nLimit = 10
    private _nOffset = 0
    private _bUseLimit = false
    private _aFilter: Array<QueryFilter> = []
    private _aOrder: QueryOrder[] = []
    private _bCount = false
    private _nId = 0
    private _aSelect: string[] = []
    private _bFileContent = false
    private _bFileContentBase64 = false
    private _aRequestQuery: Map<string, string> = new Map<string, string>()

    constructor(private _sUrl: string, private _oConfig?: QueryBuilderConfig) {
    }

    static parse(sUrl: string): QueryBuilder {
        const urlParts = sUrl.split(/\?(.*)/s)
        urlParts.pop()
        const qb = new QueryBuilder(urlParts[0])
        if (urlParts.length > 1) {
            const query = Object.fromEntries(new URLSearchParams(urlParts[1]));

            Object.keys(query).map((param: string) => {
                if (!param.startsWith('$')) {
                    qb.querySet(param, query[param])
                }
            })

            if (Object.keys(query).includes('$top')) {
                qb._parseLimit(query['$top'])
            }
            if (Object.keys(query).includes('$limit')) {
                qb._parseLimit(query['$limit'])
            }
            if (Object.keys(query).includes('$offset')) {
                qb._parseOffset(query['$offset'])
            }
            if (Object.keys(query).includes('$skip')) {
                qb._parseOffset(query['$skip'])
            }
            if (Object.keys(query).includes('$orderby')) {
                qb._parseOrderBy(query['$orderby'])
            }
            if (Object.keys(query).includes('$order')) {
                qb._parseOrderBy(query['$order'])
            }
            if (Object.keys(query).includes('$expand')) {
                qb._parseExpand(query['$expand'])
            }
            if (Object.keys(query).includes('$select')) {
                qb._parseSelect(query['$select'])
            }
            if (Object.keys(query).includes('$filter')) {
                qb._parseFilter(query['$filter'])
            }
        }
        return qb
    }

    get url(): string {
        return this._sUrl
    }

    id(mId: string | number): this {
        this._nId = Number(mId)
        return this
    }

    querySet(sKey: string, sValue: string): this {
        this._aRequestQuery.set(sKey, encodeURI(sValue))
        return this
    }

    queryDelete(sKey: string): this {
        if (this._aRequestQuery.has(sKey)) {
            this._aRequestQuery.delete(sKey)
        }
        return this
    }

    queryGet(sKey: string): string | null {
        // @ts-ignore
        return this._aRequestQuery.has(sKey) ? this._aRequestQuery.get(sKey).toString() : null
    }

    expand(mEntity: string | string[]): this {
        if (Array.isArray(mEntity)) {
            this._aExpand = this._aExpand.concat(mEntity)
        } else {
            this._aExpand.push(mEntity)
        }
        return this
    }

    select(mField: string | string[]): this {
        if (Array.isArray(mField)) {
            this._aSelect = this._aSelect.concat(mField)
        } else {
            this._aSelect.push(mField)
        }
        return this
    }

    limit(nValue: number): this {
        this._nLimit = nValue
        this._bUseLimit = true
        return this
    }

    /**
     * @alias limit
     * @param nValue
     * @returns {QueryBuilder}
     */
    top(nValue: number): this {
        return this.limit(nValue)
    }

    offset(nValue: number): this {
        this._nOffset = nValue
        return this
    }

    /**
     * @alias offset
     * @param nValue
     */
    skip(nValue: number): this {
        return this.offset(nValue)
    }

    /**
     * @alias offset
     * @param nValue
     */
    shift(nValue: number): this {
        return this.offset(nValue)
    }

    getFilter(): Array<QueryFilter> {
        return this._aFilter
    }

    filter(oFilter: QueryFilter): this {
        this._aFilter?.push(oFilter)
        return this
    }

    filterDelete(sFieldName: string): this {
        const idx = this._aFilter.findIndex((e: QueryFilter) => e.field === sFieldName)
        if (idx >= 0) {
            this._aFilter.splice(idx, 1)
        }
        return this
    }

    order(oOrder: QueryOrder): this {
        this._aOrder.push(oOrder)
        return this
    }

    /**
     * Alias for order
     * @param oOrder
     * @returns {QueryBuilder}
     */
    orderby(oOrder: QueryOrder): this {
        return this.order(oOrder)
    }

    page(nPage: number): this {
        nPage = nPage < 2 ? 1 : nPage
        const nRowsPerPage = this._oConfig?.rowsPerPage ? this._oConfig.rowsPerPage : 10
        const nShift = (nPage - 1) * nRowsPerPage
        this.limit(nRowsPerPage).offset(nShift)
        return this
    }

    count(): this {
        this._bCount = true
        return this
    }

    asFileContent(): this {
        this._bFileContentBase64 = false
        this._bFileContent = true
        return this
    }

    asFileContentBase64(): this {
        this._bFileContentBase64 = true
        this._bFileContent = false
        return this
    }

    build(): string {
        const aQuery: string[] = []
        if (!this._nId) {
            if (!this._bCount) {
                if (this._bUseLimit) {
                    aQuery.push(`$top=${this._nLimit}`)
                }
                if (this._nOffset > 0) {
                    aQuery.push(`$skip=${this._nOffset}`)
                }

                if (this._aOrder.length > 0) {
                    const aOrder: string[] = []
                    this._aOrder.map((oOrder) => {
                        aOrder.push(oOrder.build())
                    })
                    aQuery.push('$orderby=' + aOrder.join(','))
                }
            }
            // if (this._oFilter !== null) {
            //     aQuery.push('$filter=' + this._oFilter.build())
            // }
            if (this._aFilter.length > 0) {
                const filter = new QueryFilter('')
                this._aFilter.map((f: QueryFilter) => {
                    filter.addChild(f)
                })
                aQuery.push('$filter=' + filter.build())
            }
        }

        if (this._aExpand.length > 0) {
            aQuery.push('$expand=' + this._aExpand.join(','))
        }

        if (this._aSelect.length > 0) {
            aQuery.push('$select=' + this._aSelect.join(','))
        }

        if (this._aRequestQuery.size > 0) {
            this._aRequestQuery.forEach((sValue: string, sKey: string) => {
                aQuery.push(`${sKey}=${sValue}`)
            })
        }

        const sUrl = [this._sUrl]
        if (this._nId) {
            sUrl.push(`(${this._nId})`)
            if (this._bFileContent) {
                sUrl.push(`/_file`)
            } else if (this._bFileContentBase64) {
                sUrl.push(`/_file64`)
            }
        } else {
            sUrl.push(this._bCount ? '/$count' : '')
        }
        if (aQuery.length > 0) {
            sUrl.push('?')
            sUrl.push(aQuery.join('&'))
        }

        this._bUseLimit = false
        this._bCount = false
        return sUrl.join('')
    }

    private _parseLimit(value: string) {
        this.limit(+value)
    }

    private _parseOffset(value: string) {
        this.offset(+value)
    }

    private _parseOrderBy(value: string) {
        if (value === '') {
            return
        }
        value.split(',').map((fieldValue: string) => {
            const orderParts = fieldValue.trim().split(' ')
            let dir = QueryOrderDirection.ASC
            const field = orderParts[0].trim()

            if (orderParts.length === 2) {
                if (orderParts[1].trim().toLowerCase() === 'desc') {
                    dir = QueryOrderDirection.DESC
                }
            }
            this.order(new QueryOrder(field, dir))
        })
    }

    private _parseExpand(value: string) {
        if (value === '') {
            return
        }
        value.split(',').map((field: string) => {
            this.expand(field.trim())
        })
    }

    private _parseSelect(value: string) {
        if (value === '') {
            return
        }
        value.split(',').map((field: string) => {
            this.select(field.trim())
        })
    }

    private _parseFilter(value: string) {
        if (value === '') {
            return
        }
        const words = value.split(' ')

        let quote = 0;
        let text = '';
        let stage = 0;
        let matches = [];
        let group = 0;
        let o = {condition: 'and', field: '', group: 0, operator: 'eq', value: ''}
        for (let i = 0; i < words.length; i++) {
            let word = words[i]
            text = [text, word].join(' ').trim()
            let regex = /'/gi;
            let quoteCount = (word.match(regex) || []).length;
            quote += quoteCount;
            if (quote % 2 != 0) continue;

            if (i === 0) {
                stage++
                o = {condition: 'and', field: '', group: 0, operator: 'eq', value: ''}
                matches.push(o);
            }

            switch (stage) {
                case 0: // Binary operation
                    o = {condition: 'and', field: '', group: 0, operator: 'eq', value: ''}
                    matches.push(o);
                    o.condition = text;
                    stage++;
                    break;
                case 1: // Field
                    if (text.startsWith('(')) {
                        group++;
                        text = text.substring(1);
                    }
                    o.field = text;
                    o.group = group;
                    stage++;
                    break;
                case 2: // Sign
                    if ('eq,ne,lt,le,gt,ge'.split(',').includes(text.toLowerCase())) {
                        o.operator = text;
                        stage++;
                    } else {
                        o.field += text;
                    }
                    break;
                case 3: // Value
                    if (text.endsWith(')')) {
                        group--;
                        text = text.substring(0, text.length - 1);
                    }
                    o.value = text;
                    stage = 0;
                    break;
            }

            text = '';
        }

        matches.map((match: any) => {

            if (match.field.toLowerCase().startsWith('substringof') ||
                match.field.toLowerCase().startsWith('contains') ||
                match.field.toLowerCase().startsWith('endswith') ||
                match.field.toLowerCase().startsWith('startswith')) {

                const re = /(?<Operator>.+)\(((?<Field>.+),s*'(?<Value>.+)')/gm
                const groups = re.exec(match.field)?.groups
                if (groups) {
                    let val = groups.Value
                    if (groups.Value.startsWith("'")) {
                        val = groups.Value.substring(1, groups.Value.length - 1)
                    }
                    const f = new QueryFilter(groups.Field, val, groups.Operator)
                    this.filter(f);
                }
            } else {
                let val = match.value
                if (match.value.startsWith("'")) {
                    val = match.value.substring(1, match.value.length - 1)
                }
                const f = new QueryFilter(match.field, val, match.operator)
                this.filter(f);
            }
        })
    }
}
