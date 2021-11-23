
        let sortedTabledata = [];
        sortedTabledata = sortBy(historyData, 'ItemID').reverse();
        sortedTabledata.forEach((data) => {
            if (!(data.InteractionDate instanceof Date)) {
                data.InteractionDate = parse(data.InteractionDate, 'dd/M/yyyy HH:mm:ss', new Date());
            }
            if (!tableData[data.GroupID]) {
                tableData[data.GroupID] = {
                    InteractionDate: data.InteractionDate,
                    Channel: data.Channel,
                    Intent: data.Intent,
                    AgentName: data.AgentName,
                    LastServicedAgentName: Array.from(new Set((data.LastServicedAgentName || '').split(','))).join(', '),
                    CIF: data.CIF,
                    EmailID: data.EmailID,
                    NRIC: data.NRIC,
                    PhoneNumber: data.PhoneNumber,
                    OverallSentiment: data.OverallSentiment,
                    ItemID: data.ItemID,
                    SubType: data.SubType,
                    SessionID: data.SessionID,
                    Direction: data.Direction,
                    ID: data.ID,
                    GroupID: data.GroupID,
                    LastID: data.LastID,
                    InteractionText: data.InteractionText,
                    Children: [],
                    expanded: false
                };
            } else {
                const isChatGroup = data.Channel.match(/chat/i);
                if (isChatGroup) {
                    let isRecordAdded = false;
                    tableData[data.GroupID].Children = tableData[data.GroupID].Children.map((c) => {
                        const isChatRecord = c.Channel.match(/chat/i);
                        console.log(isChatRecord, c.GroupID);
                        if (isChatRecord) {
                            c.Children.push({
                                InteractionDate: data.InteractionDate,
                                Channel: data.Channel,
                                Intent: data.Intent,
                                AgentName: data.AgentName,
                                LastServicedAgentName: Array.from(new Set((data.LastServicedAgentName || '').split(','))).join(', '),
                                CIF: data.CIF,
                                EmailID: data.EmailID,
                                NRIC: data.NRIC,
                                PhoneNumber: data.PhoneNumber,
                                OverallSentiment: data.OverallSentiment,
                                ItemID: data.ItemID,
                                SubType: data.SubType,
                                SessionID: data.SessionID,
                                Direction: data.Direction,
                                ID: data.ID,
                                GroupID: data.GroupID,
                                LastID: data.LastID,
                                InteractionText: data.InteractionText,
                                Children: null,
                                expanded: false
                            });
                            isRecordAdded = true;
                        }
                        return c;
                    });
                    if (!isRecordAdded) {
                        tableData[data.GroupID].Children.push({
                            InteractionDate: data.InteractionDate,
                            Channel: data.Channel,
                            Intent: data.Intent,
                            AgentName: data.AgentName,
                            LastServicedAgentName: Array.from(new Set((data.LastServicedAgentName || '').split(','))).join(', '),
                            CIF: data.CIF,
                            EmailID: data.EmailID,
                            NRIC: data.NRIC,
                            PhoneNumber: data.PhoneNumber,
                            OverallSentiment: data.OverallSentiment,
                            ItemID: data.ItemID,
                            SubType: data.SubType,
                            SessionID: data.SessionID,
                            Direction: data.Direction,
                            ID: data.ID,
                            GroupID: data.GroupID,
                            LastID: data.LastID,
                            InteractionText: data.InteractionText,
                            Children: [],
                            expanded: false
                        });
                    }
                } else {
                    const Children = tableData[data.GroupID].Children;
                    Children.push({ ...tableData[data.GroupID], Children: null });
                    tableData[data.GroupID] = {
                        InteractionDate: data.InteractionDate,
                        Channel: data.Channel,
                        Intent: data.Intent,
                        AgentName: data.AgentName,
                        LastServicedAgentName: Array.from(new Set((data.LastServicedAgentName || '').split(','))).join(', '),
                        CIF: data.CIF,
                        EmailID: data.EmailID,
                        NRIC: data.NRIC,
                        PhoneNumber: data.PhoneNumber,
                        OverallSentiment: data.OverallSentiment,
                        ItemID: data.ItemID,
                        SubType: data.SubType,
                        SessionID: data.SessionID,
                        Direction: data.Direction,
                        ID: data.ID,
                        GroupID: data.GroupID,
                        LastID: data.LastID,
                        InteractionText: data.InteractionText,
                        Children,
                        expanded: false
                    };
                }
            }
        });
        // order table data by received date
        if (!this.table.source.data) {
            this.table.source.data = [];
        }

        const newRecords = orderBy(Object.values(tableData), ['InteractionDate'], ['desc']);
        this.table.source.data = this.table.source.data.concat(newRecords);
        const lastEl = sortedTabledata.slice(-1) || [];